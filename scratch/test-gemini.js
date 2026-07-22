const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log('API Key exists:', !!apiKey);

const google = createGoogleGenerativeAI({
  apiKey,
});

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const response = await generateText({
      model: google(modelName),
      prompt: 'Hello! Respond in 3 words.',
    });
    console.log(`Success! Response for ${modelName}:`, response.text);
    return true;
  } catch (err) {
    console.error(`Error for ${modelName}:`, err.message);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-2.5-pro',
  ];
  
  for (const model of models) {
    await testModel(model);
    console.log('-------------------');
  }
}

run();
