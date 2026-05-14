#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TEMPLATES = [
  'casefile',
  'jane',
  'pearltech',
  'signal',
  'stelvio',
  'velora',
  'welvet',
  'portfolite',
  'yuya',
];

const OUTPUT_DIR = path.join(__dirname, '../public/templates/lio');

async function captureTemplate(templateId) {
  console.log(`Capturing ${templateId}...`);
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 1600 },
    });

    await page.goto(`http://localhost:3000/resume-lio/preview?template=${templateId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for animations to settle
    await page.waitForTimeout(800);

    const pngBuffer = await page.screenshot({ fullPage: false });
    const webpPath = path.join(OUTPUT_DIR, `${templateId}.webp`);

    // Convert PNG to WebP using sharp
    await sharp(pngBuffer)
      .resize(600, 800, {
        fit: 'cover',
        position: 'top',
      })
      .webp({ quality: 80 })
      .toFile(webpPath);

    console.log(`✓ ${templateId} → ${webpPath}`);
    await page.close();
  } catch (error) {
    console.error(`✗ Error capturing ${templateId}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('Starting template thumbnail capture...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const template of TEMPLATES) {
    await captureTemplate(template);
  }

  console.log('\n✓ All template thumbnails updated successfully!');
}

main().catch(console.error);
