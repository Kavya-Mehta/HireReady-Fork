"""
Database module for storing user data, interview sessions, and chat history.
Uses PostgreSQL for scalable, cloud-based database storage with UTC timestamps.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from typing import List, Dict, Optional
import json
import hashlib
import secrets
import os

class InterviewDatabase:
    def __init__(self, database_url: str = None):
        """Initialize database connection and create tables if they don't exist."""
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is not set. Please add it to your .env file.")
        self.init_database()
    
    def get_connection(self):
        """Create and return a database connection."""
        conn = psycopg2.connect(self.database_url)
        return conn
    
    def init_database(self):
        """Create database tables if they don't exist."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                salt TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
            )
        """)
        
        # Interview sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                session_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                track TEXT NOT NULL,
                interview_type TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                num_questions INTEGER NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                completed_at TIMESTAMP WITH TIME ZONE,
                status TEXT DEFAULT 'in_progress',
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        
        # Chat messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                message_id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id)
            )
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
    
    # ─── User Management ───────────────────────────────────────────────────
    
    def _hash_password(self, password: str, salt: str = None) -> tuple:
        """Hash password with salt. Returns (hash, salt)."""
        if salt is None:
            salt = secrets.token_hex(32)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), 
                                           salt.encode('utf-8'), 100000).hex()
        return password_hash, salt
    
    def create_user(self, username: str, password: str) -> tuple:
        """Create a new user with username and password. Returns (user_id, success, message)."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            # Check if username already exists
            cursor.execute("SELECT user_id, password_hash FROM users WHERE username = %s", (username,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                # If user exists but has no password (legacy user), allow password setup
                if existing_user['password_hash'] is None:
                    password_hash, salt = self._hash_password(password)
                    cursor.execute(
                        "UPDATE users SET password_hash = %s, salt = %s WHERE user_id = %s",
                        (password_hash, salt, existing_user['user_id'])
                    )
                    conn.commit()
                    user_id = existing_user['user_id']
                    cursor.close()
                    conn.close()
                    return user_id, True, "Password set successfully for existing account"
                else:
                    cursor.close()
                    conn.close()
                    return None, False, "Username already exists"
            
            # Hash password and create new user
            password_hash, salt = self._hash_password(password)
            cursor.execute(
                "INSERT INTO users (username, password_hash, salt) VALUES (%s, %s, %s) RETURNING user_id",
                (username, password_hash, salt)
            )
            user_id = cursor.fetchone()['user_id']
            conn.commit()
            cursor.close()
            conn.close()
            return user_id, True, "User created successfully"
        except Exception as e:
            cursor.close()
            conn.close()
            return None, False, f"Error creating user: {str(e)}"
    
    def authenticate_user(self, username: str, password: str) -> tuple:
        """Authenticate user with username and password. Returns (user_id, success, message)."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT user_id, password_hash, salt FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return None, False, "Username not found"
        
        user_id = result['user_id']
        stored_hash = result['password_hash']
        salt = result['salt']
        
        # Handle legacy users without passwords
        if stored_hash is None or salt is None:
            return None, False, "Account needs password setup. Please use Sign Up to create a new account."
        
        password_hash, _ = self._hash_password(password, salt)
        
        if password_hash == stored_hash:
            return user_id, True, "Login successful"
        else:
            return None, False, "Incorrect password"
    
    def get_user_id(self, username: str) -> Optional[int]:
        """Get user_id for a given username."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result['user_id'] if result else None
    
    # ─── Interview Session Management ──────────────────────────────────────
    
    def create_session(self, user_id: int, track: str, interview_type: str, 
                      difficulty: str, num_questions: int) -> int:
        """Create a new interview session and return session_id."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            INSERT INTO interview_sessions 
            (user_id, track, interview_type, difficulty, num_questions)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING session_id
        """, (user_id, track, interview_type, difficulty, num_questions))
        session_id = cursor.fetchone()['session_id']
        conn.commit()
        cursor.close()
        conn.close()
        return session_id
    
    def update_session_status(self, session_id: int, status: str):
        """Update session status (in_progress, completed, abandoned)."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE interview_sessions 
            SET status = %s, completed_at = NOW() AT TIME ZONE 'UTC'
            WHERE session_id = %s
        """, (status, session_id))
        conn.commit()
        cursor.close()
        conn.close()
    
    def get_user_sessions(self, user_id: int, limit: int = 10) -> List[Dict]:
        """Get recent interview sessions for a user."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT session_id, track, interview_type, difficulty, 
                   num_questions, started_at, completed_at, status
            FROM interview_sessions
            WHERE user_id = %s
            ORDER BY started_at DESC
            LIMIT %s
        """, (user_id, limit))
        sessions = [dict(row) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return sessions
    
    # ─── Chat Message Management ───────────────────────────────────────────
    
    def save_message(self, session_id: int, role: str, content: str):
        """Save a chat message to the database."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (session_id, role, content)
            VALUES (%s, %s, %s)
        """, (session_id, role, content))
        conn.commit()
        cursor.close()
        conn.close()
    
    def get_session_messages(self, session_id: int) -> List[Dict]:
        """Get all messages for a specific session."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT message_id, role, content, timestamp
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY timestamp ASC
        """, (session_id,))
        messages = [dict(row) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return messages
    
    def get_session_details(self, session_id: int) -> Optional[Dict]:
        """Get complete session details including all messages."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get session info
        cursor.execute("""
            SELECT s.session_id, s.track, s.interview_type, s.difficulty,
                   s.num_questions, s.started_at, s.completed_at, s.status,
                   u.username
            FROM interview_sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.session_id = %s
        """, (session_id,))
        
        session = cursor.fetchone()
        if not session:
            cursor.close()
            conn.close()
            return None
        
        session_dict = dict(session)
        
        # Get all messages
        cursor.execute("""
            SELECT role, content, timestamp
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY timestamp ASC
        """, (session_id,))
        
        session_dict['messages'] = [dict(row) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return session_dict
    
    # ─── Statistics and Analytics ──────────────────────────────────────────
    
    def get_user_stats(self, user_id: int) -> Dict:
        """Get statistics for a user's interview history."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Total sessions
        cursor.execute("""
            SELECT COUNT(*) as total_sessions,
                   SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
            FROM interview_sessions
            WHERE user_id = %s
        """, (user_id,))
        stats = dict(cursor.fetchone())
        
        # Sessions by track
        cursor.execute("""
            SELECT track, COUNT(*) as count
            FROM interview_sessions
            WHERE user_id = %s
            GROUP BY track
        """, (user_id,))
        stats['by_track'] = {row['track']: row['count'] for row in cursor.fetchall()}
        
        # Sessions by difficulty
        cursor.execute("""
            SELECT difficulty, COUNT(*) as count
            FROM interview_sessions
            WHERE user_id = %s
            GROUP BY difficulty
        """, (user_id,))
        stats['by_difficulty'] = {row['difficulty']: row['count'] for row in cursor.fetchall()}
        
        cursor.close()
        conn.close()
        return stats
