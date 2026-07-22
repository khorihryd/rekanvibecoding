import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

export const dynamic = 'force-dynamic';

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  model?: 'gemini-3.5-flash' | 'gpt-4o' | 'claude-3-5-sonnet' | string;
}

/**
 * Helper function to generate text content using Vercel AI SDK.
 * Supports Google Gemini and OpenAI models.
 * If API keys are missing, falls back to mockup responses to keep dev flow smooth.
 */
export async function generateTextContent(options: GenerateTextOptions): Promise<{
  text: string;
  modelUsed: string;
  isMock: boolean;
}> {
  const { prompt, systemPrompt, model = 'gemini-3.5-flash' } = options;

  const isGemini = model.startsWith('gemini');
  const isOpenAi = model.startsWith('gpt');
  const isClaude = model.startsWith('claude'); // Claude fallback if client key not set, or we can use OpenAI/Gemini as fallback

  // Check keys
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Decide if we should run in Mock mode
  const shouldMock = (isGemini && !geminiKey) || (isOpenAi && !openaiKey) || isClaude;

  if (shouldMock) {
    console.log(`[AI Engine Mock Mode] Simulating response for model: ${model}`);
    
    // Generate a high-fidelity mock response depending on prompt content
    let mockText = '';
    
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('decide') || lowerPrompt.includes('keputusan') || lowerPrompt.includes('arsitektur')) {
      mockText = `### Keputusan Arsitektur: Penggunaan Supabase sebagai Database Utama

**Deskripsi:**
Kami memutuskan untuk menggunakan PostgreSQL yang di-host oleh Supabase sebagai database utama aplikasi.

**Alasan & Analisis (Reasoning):**
1. **Keamanan Bawaan (RLS):** Supabase mendukung Row Level Security (RLS) secara native, memungkinkan kita mendefinisikan aturan akses baris langsung di tingkat database. Hal ini mengurangi kompleksitas kode API server-side dan meminimalisir risiko kebocoran data antar pengguna.
2. **Real-time Engine:** Mendukung sinkronisasi state instan yang sangat membantu simulasi penugasan AI Engineer dan tracking status.
3. **Kecepatan Integrasi:** SDK resmi sangat matang dan siap pakai pada ekosistem Next.js.

**Dampak:**
- Seluruh query client-side harus menyertakan header authorization JWT Supabase.
- Harus dibuat tabel projects, decisions, tasks, dan project_state dengan RLS aktif.`;
    } else if (lowerPrompt.includes('task') || lowerPrompt.includes('tugas') || lowerPrompt.includes('feature')) {
      mockText = `### Rencana Implementasi: Task 2.1 - Koneksi GitHub OAuth

**Deskripsi Tugas:**
Mengintegrasikan autentikasi GitHub OAuth agar pengguna dapat menghubungkan repositori mereka dengan aman.

**Spesifikasi Teknis:**
1. Tambahkan tombol "Hubungkan GitHub" di Dashboard.
2. Buat API endpoint \`/api/auth/github/login\` untuk mengarahkan pengguna ke GitHub.
3. Buat API endpoint \`/api/auth/github/callback\` untuk menerima callback, menukar code dengan access token, dan menyimpannya di tabel \`github_tokens\`.
4. Tambahkan RLS policy di \`github_tokens\` untuk membatasi akses baca/tulis hanya kepada pemilik token.`;
    } else {
      mockText = `Halo! Saya adalah CSA (Chief Software Architect) Engine. 
Saya menerima instruksi Anda: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}".

Ini adalah respon simulasi dalam mode offline. Untuk mengaktifkan respon AI sungguhan, pastikan Anda telah memasukkan \`GOOGLE_GENERATIVE_AI_API_KEY\` (untuk Gemini) atau \`OPENAI_API_KEY\` (untuk GPT) ke dalam berkas \`.env.local\` Anda.`;
    }

    return {
      text: mockText,
      modelUsed: `${model} (Mockup)`,
      isMock: true
    };
  }

  try {
    let aiModel: any;

    if (isOpenAi) {
      aiModel = openai(model);
    } else {
      // Default to Google Gemini if not OpenAI or specifically Gemini
      aiModel = google(model === 'gemini-3.5-flash' ? 'gemini-1.5-flash' : model);
    }

    const response = await generateText({
      model: aiModel,
      prompt,
      system: systemPrompt || 'You are CSA (Chief Software Architect), a strict senior developer overseeing AI coding agents.',
      temperature: 0.2
    });

    return {
      text: response.text,
      modelUsed: model,
      isMock: false
    };

  } catch (err: any) {
    console.error(`Error generating text with ${model}:`, err.message || err);
    throw err;
  }
}
