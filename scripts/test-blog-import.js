#!/usr/bin/env node
/**
 * Quick Blog Import Test (uses Cloudflare AI, no Firecrawl needed)
 *
 * Usage: node scripts/test-blog-import.js [blog-url]
 */

const fs = require('fs');
const path = require('path');

// Simple env loader
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}
loadEnv();

const CLOUDFLARE_ACCOUNT_ID = process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN;

const testUrl = process.argv[2] || 'https://www.eitanbernath.com/2024/06/06/sesame-schnitzel-topped-with-loaded-salad/';

async function fetchWebpage(url) {
  console.log('1. Fetching webpage...');
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.text();
}

function extractTextFromHtml(html) {
  // Remove script, style, nav, header, footer
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Extract images
  const imageMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  const images = imageMatches
    ?.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  // Convert to text
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit length
  if (text.length > 8000) {
    text = text.slice(0, 8000) + '...';
  }

  // Add images
  if (images?.length > 0) {
    text += '\n\nImages: ' + images.join('\n');
  }

  return text;
}

async function extractRecipeWithCloudflare(content) {
  console.log('\n2. Extracting recipe with Cloudflare AI...');

  const prompt = `Extract the recipe from this webpage content. Return ONLY valid JSON:
{
  "title": "Recipe name",
  "ingredients": ["1 cup flour", "2 eggs"],
  "instructions": ["Step 1", "Step 2"],
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "servings": 4,
  "image": "https://example.com/image.jpg"
}

Webpage content:
${content}`;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Extract recipes from webpage content. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2048,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare AI error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare AI failed: ${JSON.stringify(data)}`);
  }

  return data.result.response;
}

async function main() {
  console.log('Blog Recipe Import Test (Cloudflare AI)');
  console.log('=======================================');
  console.log(`URL: ${testUrl}`);
  console.log(`Cloudflare: ${CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN ? 'Set' : 'MISSING'}`);
  console.log('');

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('ERROR: Cloudflare credentials not set in .env.local');
    process.exit(1);
  }

  try {
    // Step 1: Fetch webpage
    const html = await fetchWebpage(testUrl);
    console.log(`   Fetched ${html.length} bytes`);

    // Step 2: Extract text
    const text = extractTextFromHtml(html);
    console.log(`   Extracted ${text.length} chars of text`);

    // Step 3: Extract recipe with AI
    const aiResponse = await extractRecipeWithCloudflare(text);

    // Step 4: Parse JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const recipe = JSON.parse(jsonMatch[0]);

      console.log('\n3. Extracted Recipe:');
      console.log(`   Title: ${recipe.title}`);
      console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
      console.log(`   Instructions: ${recipe.instructions?.length || 0}`);
      console.log(`   Prep Time: ${recipe.prepTime || 'N/A'}`);
      console.log(`   Cook Time: ${recipe.cookTime || 'N/A'}`);
      console.log(`   Servings: ${recipe.servings || 'N/A'}`);
      console.log(`   Image: ${recipe.image ? 'Yes' : 'No'}`);

      if (recipe.ingredients?.length > 0) {
        console.log('\n   Sample ingredients:');
        recipe.ingredients.slice(0, 5).forEach((ing, i) => {
          console.log(`     ${i + 1}. ${ing}`);
        });
      }

      if (recipe.instructions?.length > 0) {
        console.log('\n   Sample instructions:');
        recipe.instructions.slice(0, 3).forEach((step, i) => {
          console.log(`     ${i + 1}. ${step.slice(0, 80)}${step.length > 80 ? '...' : ''}`);
        });
      }

      console.log('\n   SUCCESS - Blog import pipeline working!');
    } else {
      console.log('\n   AI Response (no JSON found):');
      console.log(aiResponse);
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    process.exit(1);
  }
}

main();
