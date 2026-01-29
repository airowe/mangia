#!/usr/bin/env node

/**
 * App Store Screenshot Generator for Mangia
 *
 * Uses actual UI mockups from ui-redesign/stitch_recipe_library
 * and wraps them in App Store marketing frames with headlines.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// App Store required screenshot sizes (iPhone only)
const SCREENSHOT_SIZES = {
  // iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max)
  'iphone-6.7': { width: 1290, height: 2796 },
  // iPhone 6.5" (iPhone 14 Plus, 11 Pro Max)
  'iphone-6.5': { width: 1284, height: 2778 },
  // iPhone 5.5" (iPhone 8 Plus) - required
  'iphone-5.5': { width: 1242, height: 2208 },
};

// Screenshot variants using actual UI mockups
const SCREENSHOTS = [
  {
    name: '01_library',
    headline: 'Your Recipe<br>Collection',
    subheadline: 'Import from TikTok, YouTube & any blog',
    image: 'recipe_library_1/screen.png'
  },
  {
    name: '02_import',
    headline: 'Import Recipes<br>From Anywhere',
    subheadline: 'Paste any URL - we extract the recipe',
    image: 'import_recipe_via_url_1/screen.png'
  },
  {
    name: '03_pantry',
    headline: 'Track Your<br>Pantry',
    subheadline: 'Know what you have, reduce waste',
    image: 'pantry_inventory_1/screen.png'
  },
  {
    name: '04_grocery',
    headline: 'Smart<br>Grocery Lists',
    subheadline: 'Organized by category, easy to shop',
    image: 'grocery_shopping_list_1/screen.png'
  },
  {
    name: '05_whatcanImake',
    headline: 'What Can<br>I Make?',
    subheadline: 'Find recipes with ingredients you have',
    image: 'what_can_i_make?_1/screen.png'
  },
];

const UI_REDESIGN_PATH = path.join(__dirname, '../../ui-redesign/stitch_recipe_library');

async function generateScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const outputDir = path.join(__dirname, 'en-US');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [sizeName, dimensions] of Object.entries(SCREENSHOT_SIZES)) {
    console.log(`Generating ${sizeName} screenshots...`);

    for (const screenshot of SCREENSHOTS) {
      const page = await browser.newPage();
      await page.setViewport(dimensions);

      // Read the source image and convert to base64
      const imagePath = path.join(UI_REDESIGN_PATH, screenshot.image);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      // Generate HTML content for this screenshot
      const html = generateHTML(screenshot, dimensions, dataUrl);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for fonts and image to load
      await page.evaluateHandle('document.fonts.ready');
      await page.waitForSelector('img.phone-image', { timeout: 5000 });

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `${sizeName}_${screenshot.name}.png`;
      const filepath = path.join(outputDir, filename);

      await page.screenshot({ path: filepath, type: 'png' });
      console.log(`  Created: ${filename}`);

      await page.close();
    }
  }

  await browser.close();
  console.log('\nAll screenshots generated!');
}

function generateHTML(screenshot, dimensions, imageDataUrl) {
  const scale = dimensions.width / 1290; // Scale based on 6.7" as reference

  // iPhone screen aspect ratio is roughly 9:19.5 (width:height)
  // We want the phone to take up most of the remaining space after headline
  const headerHeight = 220 * scale; // headline + subheadline + margins
  const bottomPadding = 60 * scale;
  const availableHeight = dimensions.height - headerHeight - bottomPadding;

  // Phone frame adds padding around the screen
  const framePadding = 14 * scale;
  const screenHeight = availableHeight - (framePadding * 2);
  const screenWidth = screenHeight * (9 / 19.5); // iPhone aspect ratio
  const phoneWidth = screenWidth + (framePadding * 2);

  const fontSize = Math.round(56 * scale);
  const subFontSize = Math.round(24 * scale);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(165deg, #FBF9F5 0%, #F5E3C1 50%, #E8D4B0 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: ${80 * scale}px;
      padding-bottom: ${bottomPadding}px;
      overflow: hidden;
    }

    .headline {
      font-family: 'Libre Bodoni', Georgia, serif;
      font-size: ${fontSize}px;
      font-weight: 500;
      color: #3A322C;
      text-align: center;
      margin-bottom: ${16 * scale}px;
      line-height: 1.15;
    }

    .subheadline {
      font-size: ${subFontSize}px;
      color: #7A716A;
      text-align: center;
      margin-bottom: ${40 * scale}px;
      font-weight: 500;
    }

    .phone-frame {
      width: ${phoneWidth}px;
      height: ${availableHeight}px;
      background: #2A1F18;
      border-radius: ${52 * scale}px;
      padding: ${framePadding}px;
      box-shadow:
        0 ${30 * scale}px ${80 * scale}px rgba(58, 50, 44, 0.35),
        0 ${10 * scale}px ${30 * scale}px rgba(58, 50, 44, 0.2);
      display: flex;
      flex-direction: column;
    }

    .phone-screen {
      background: #FBF9F5;
      border-radius: ${40 * scale}px;
      flex: 1;
      overflow: hidden;
    }

    .phone-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
    }

    /* Decorative elements */
    .decor-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
    }

    .decor-1 {
      width: ${200 * scale}px;
      height: ${200 * scale}px;
      background: #A8BCA0;
      top: ${120 * scale}px;
      right: ${-50 * scale}px;
    }

    .decor-2 {
      width: ${150 * scale}px;
      height: ${150 * scale}px;
      background: #D97742;
      bottom: ${200 * scale}px;
      left: ${-40 * scale}px;
    }
  </style>
</head>
<body>
  <div class="decor-circle decor-1"></div>
  <div class="decor-circle decor-2"></div>

  <h1 class="headline">${screenshot.headline}</h1>
  <p class="subheadline">${screenshot.subheadline}</p>

  <div class="phone-frame">
    <div class="phone-screen">
      <img class="phone-image" src="${imageDataUrl}" alt="App screenshot" />
    </div>
  </div>
</body>
</html>`;
}

generateScreenshots().catch(console.error);
