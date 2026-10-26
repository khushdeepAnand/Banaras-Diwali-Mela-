import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ 
    args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    headless: true 
  });
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5174/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Click enter ghat
  await page.getByRole('button', { name: /enter the ghat/i }).click();
  await page.waitForTimeout(3000);
  
  // Screenshot 1: Overall desktop riverfront
  await page.screenshot({ path: '/Users/khushdeep/Downloads/banaras-diwali-mela/docs/phase6/baseline-desktop-riverfront.png', fullPage: true });
  
  // Change to high quality
  await page.getByLabel('Graphics').selectOption('high');
  await page.waitForTimeout(2000);
  
  // Screenshot 2: Water and diya reflections close-up - move camera
  await page.keyboard.down('w');
  await page.waitForTimeout(2000);
  await page.keyboard.up('w');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/khushdeep/Downloads/banaras-diwali-mela/docs/phase6/baseline-water-closeup.png', fullPage: true });
  
  // Screenshot 3: Ganga Aarti - move toward it
  await page.keyboard.down('s');
  await page.waitForTimeout(2000);
  await page.keyboard.up('s');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/khushdeep/Downloads/banaras-diwali-mela/docs/phase6/baseline-ganga-aarti.png', fullPage: true });
  
  // Screenshot 4: Market stalls
  await page.keyboard.down('a');
  await page.waitForTimeout(1000);
  await page.keyboard.up('a');
  await page.keyboard.down('s');
  await page.waitForTimeout(2000);
  await page.keyboard.up('s');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/khushdeep/Downloads/banaras-diwali-mela/docs/phase6/baseline-market-stalls.png', fullPage: true });
  
  // Screenshot 5: Ferris wheel
  await page.keyboard.down('d');
  await page.waitForTimeout(3000);
  await page.keyboard.up('d');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/khushdeep/Downloads/banaras-diwali-mela/docs/phase6/baseline-ferris-wheel.png', fullPage: true });
  
  // Mobile view
  await browser.close();
  
  const browser2 = await chromium.launch({ 
    args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    headless: true 
  });
  const context2 = await browser2.newContext({ 
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page2 = await context2.newPage();
  
  await page2.goto('http://localhost:5174/');
  await page2.waitForLoadState('networkidle');
  await page2.waitForTimeout(3000);
  await page2.getByRole('button', { name: /enter the ghat/i }).click();
  await page2.waitForTimeout(3000);
  
  // Screenshot 6: Mobile portrait view
  await page2.screenshot({ path: '/Users/khushdeep/Downloads/banaras-diwali-mela/docs/phase6/baseline-mobile-portrait.png', fullPage: true });
  
  await browser2.close();
  console.log('Baseline screenshots captured');
}

capture().catch(console.error);
