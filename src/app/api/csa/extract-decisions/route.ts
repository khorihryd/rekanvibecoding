import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Teks rekomendasi tidak boleh kosong.' }, { status: 400 });
    }

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let decisions: Array<{ text: string; reasoning: string }> = [];

    if (geminiKey) {
      const response = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: `Analisis teks rekomendasi arsitektur berikut dan ekstrak daftar keputusan arsitektur konkrit beserta rasionalisasinya.

Teks Rekomendasi:
"""
${text}
"""

Kembalikan hasilnya dalam format JSON murni dengan skema seperti ini (tanpa markdown formatting, tanpa word wrapping, pastikan JSON valid):
{
  "decisions": [
    {
      "text": "Judul keputusan singkat (maksimal 80 karakter, contoh: 'Menggunakan Supabase untuk Auth dan DB PostgreSQL')",
      "reasoning": "Rasionalisasi/Alasan mengapa keputusan ini diambil secara ringkas"
    }
  ]
}
`,
        temperature: 0.1
      });

      try {
        const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        decisions = parsed.decisions || [];
      } catch (parseErr) {
        console.error('Error parsing decisions JSON from LLM:', response.text, parseErr);
      }
    }

    // Fallback if empty or mock
    if (decisions.length === 0) {
      decisions = [
        {
          text: 'Arsitektur Proyek Rekomendasi CSA',
          reasoning: 'Rancangan arsitektur dasar yang disepakati oleh pengguna selama sesi brainstorming.'
        }
      ];
    }

    return NextResponse.json({ success: true, decisions });
  } catch (err: any) {
    console.error('Error extracting decisions:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal mengekstrak keputusan.' }, { status: 500 });
  }
}
