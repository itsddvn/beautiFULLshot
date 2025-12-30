import { chromium } from 'playwright';

async function debugApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Collect console messages
  const logs = [];
  page.on('console', msg => {
    logs.push('[' + msg.type() + '] ' + msg.text());
  });

  // Collect page errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    console.log('Navigating to http://localhost:1420...');
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Get page content
    const bodyText = await page.locator('body').innerText().catch(() => '(empty)');

    console.log('\n=== PAGE INFO ===');
    console.log('Title:', await page.title());
    console.log('URL:', page.url());
    console.log('Body text length:', bodyText.length);
    console.log('Body text preview:', bodyText.slice(0, 200) || '(empty)');

    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));

    console.log('\n=== PAGE ERRORS ===');
    if (errors.length === 0) {
      console.log('(no errors)');
    } else {
      errors.forEach(err => console.log('ERROR:', err));
    }

    // Check for specific elements
    console.log('\n=== DOM CHECK ===');
    console.log('#root exists:', await page.locator('#root').count() > 0);
    const rootHtml = await page.locator('#root').innerHTML().catch(() => '');
    console.log('#root innerHTML length:', rootHtml.length);
    console.log('#root innerHTML preview:', rootHtml.slice(0, 500));

    // Take screenshot
    await page.screenshot({ path: '/tmp/debug-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved to /tmp/debug-screenshot.png');

  } catch (err) {
    console.error('Navigation error:', err.message);
  }

  await browser.close();
}

debugApp();
