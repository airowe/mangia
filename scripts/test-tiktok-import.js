#!/usr/bin/env node
/**
 * Quick TikTok Import Test - Tests the full pipeline with transcript
 *
 * Usage: node scripts/test-tiktok-import.js [tiktok-url]
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

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const CLOUDFLARE_ACCOUNT_ID = process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN;

const testUrl = process.argv[2] || 'https://www.tiktok.com/@eitan/video/7598657409736805662';

async function main() {
  console.log('TikTok Recipe Import Test (with Transcript)');
  console.log('============================================');
  console.log(`URL: ${testUrl}`);
  console.log(`RapidAPI Key: ${RAPIDAPI_KEY ? 'Set' : 'MISSING'}`);
  console.log(`Cloudflare: ${CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN ? 'Set' : 'MISSING'}`);
  console.log('');

  if (!RAPIDAPI_KEY) {
    console.error('ERROR: EXPO_PUBLIC_RAPIDAPI_KEY not set');
    process.exit(1);
  }

  try {
    // Step 1: Get spoken transcript (instructions)
    console.log('1. Fetching spoken transcript...');
    const transcriptResponse = await fetch(
      `https://tiktok-video-transcript.p.rapidapi.com/transcribe?url=${encodeURIComponent(testUrl)}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-transcript.p.rapidapi.com',
        },
      }
    );

    let spokenText = '';
    if (transcriptResponse.ok) {
      const transcriptData = await transcriptResponse.json();
      if (transcriptData.success && transcriptData.text) {
        spokenText = transcriptData.text;
        console.log(`   Got transcript: ${spokenText.length} chars`);
        console.log(`   Preview: "${spokenText.slice(0, 150)}..."`);
      }
    } else {
      console.log(`   Transcript not available (${transcriptResponse.status})`);
    }

    // Step 2: Get video caption (ingredients)
    console.log('\n2. Fetching video caption...');
    const captionResponse = await fetch(
      `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(testUrl)}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
      }
    );

    let caption = '';
    if (captionResponse.ok) {
      const captionData = await captionResponse.json();
      caption = captionData.data?.title || captionData.data?.desc || '';
      console.log(`   Got caption: ${caption.length} chars`);
      console.log(`   Preview: "${caption.slice(0, 150)}..."`);
    }

    // Step 3: Combine sources
    let combinedContent = '';
    if (caption && spokenText) {
      combinedContent = `VIDEO CAPTION (ingredients):\n${caption}\n\nSPOKEN INSTRUCTIONS:\n${spokenText}`;
      console.log('\n3. Combined transcript + caption');
    } else if (spokenText) {
      combinedContent = spokenText;
      console.log('\n3. Using transcript only');
    } else if (caption) {
      combinedContent = caption;
      console.log('\n3. Using caption only');
    } else {
      throw new Error('No content available');
    }

    // Step 4: Extract recipe with AI
    console.log('\n4. Extracting recipe with Cloudflare AI...');

    const prompt = `Extract the recipe from this TikTok video. The caption usually contains ingredients, and the spoken text contains cooking instructions. Return ONLY valid JSON:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [{"name": "ingredient", "quantity": "1", "unit": "cup"}],
  "instructions": ["Step 1", "Step 2"],
  "servings": 4
}

${combinedContent}`;

    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Extract recipes from video content. Return only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2048,
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error(`Cloudflare AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const jsonMatch = aiData.result?.response?.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const recipe = JSON.parse(jsonMatch[0]);

      console.log('\n5. EXTRACTED RECIPE:');
      console.log(`   Title: ${recipe.title}`);
      console.log(`   Description: ${recipe.description || 'N/A'}`);
      console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
      console.log(`   Instructions: ${recipe.instructions?.length || 0}`);
      console.log(`   Servings: ${recipe.servings || 'N/A'}`);

      if (recipe.ingredients?.length > 0) {
        console.log('\n   Ingredients:');
        recipe.ingredients.slice(0, 5).forEach((ing, i) => {
          console.log(`     ${i + 1}. ${ing.quantity} ${ing.unit} ${ing.name}`.trim());
        });
        if (recipe.ingredients.length > 5) {
          console.log(`     ... and ${recipe.ingredients.length - 5} more`);
        }
      }

      if (recipe.instructions?.length > 0) {
        console.log('\n   Instructions:');
        recipe.instructions.forEach((step, i) => {
          console.log(`     ${i + 1}. ${step.slice(0, 70)}${step.length > 70 ? '...' : ''}`);
        });
      }

      console.log('\n   SUCCESS - Full TikTok import working!');
    } else {
      console.log('\n   AI Response (no JSON found):');
      console.log(aiData.result?.response?.slice(0, 500));
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    process.exit(1);
  }
}

main();
