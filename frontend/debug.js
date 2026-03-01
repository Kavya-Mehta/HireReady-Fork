const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  const sizes = await page.evaluate(() => {
    return {
      windowInnerHeight: window.innerHeight,
      htmlHeight: document.documentElement.clientHeight,
      bodyHeight: document.body.clientHeight,
      rootHeight: document.getElementById('root') ? document.getElementById('root').clientHeight : null,
      layoutBoundingRect: document.querySelector('#root > div') ? document.querySelector('#root > div').getBoundingClientRect().toJSON() : null,
      sidebarRect: document.querySelector('#root > div > div.w-72') ? document.querySelector('#root > div > div.w-72').getBoundingClientRect().toJSON() : null,
    };
  });
  console.log(JSON.stringify(sizes, null, 2));
  await browser.close();
})();
