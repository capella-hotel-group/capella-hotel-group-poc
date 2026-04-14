#!/usr/bin/env node
/* global process */

/**
 * Capture screenshots of an AEM EDS page at multiple viewport sizes.
 *
 * Usage:
 *   node capture-screenshots.js <url> [outputDir]
 *
 * Examples:
 *   node capture-screenshots.js https://branch--capella-hotel-group-poc--ogilvy.aem.page/path
 *   node capture-screenshots.js https://main--capella-hotel-group-poc--ogilvy.aem.page/path ./my-screenshots
 *
 * Requires: npm install (playwright must be installed)
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function captureScreenshots(url, outputDir = './screenshots') {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Desktop screenshot (1200px)
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // Wait for animations
  await page.screenshot({
    path: path.join(outputDir, 'desktop.png'),
    fullPage: true,
  });
  console.log(`✅ Desktop screenshot saved`);

  // Tablet screenshot (768px)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(outputDir, 'tablet.png'),
    fullPage: true,
  });
  console.log(`✅ Tablet screenshot saved`);

  // Mobile screenshot (375px)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(outputDir, 'mobile.png'),
    fullPage: true,
  });
  console.log(`✅ Mobile screenshot saved`);

  // Optional: capture a specific block or element
  // Uncomment and update the selector as needed:
  // const block = page.locator('.my-block');
  // if (await block.count() > 0) {
  //   await block.screenshot({ path: path.join(outputDir, 'block.png') });
  //   console.log('✅ Block screenshot saved');
  // }

  await browser.close();

  const results = {
    desktop: path.join(outputDir, 'desktop.png'),
    tablet: path.join(outputDir, 'tablet.png'),
    mobile: path.join(outputDir, 'mobile.png'),
  };

  console.log('\nScreenshots saved:');
  Object.entries(results).forEach(([viewport, filePath]) => {
    console.log(`  ${viewport}: ${filePath}`);
  });

  return results;
}

// CLI entry point
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node capture-screenshots.js <url> [outputDir]');
  console.error('');
  console.error('Examples:');
  console.error('  node capture-screenshots.js https://branch--capella-hotel-group-poc--ogilvy.aem.page/path');
  console.error(
    '  node capture-screenshots.js https://main--capella-hotel-group-poc--ogilvy.aem.page/path ./screenshots',
  );
  process.exit(1);
}

const [url, outputDir] = args;

captureScreenshots(url, outputDir).catch((error) => {
  console.error('Error capturing screenshots:', error.message);
  process.exit(1);
});
