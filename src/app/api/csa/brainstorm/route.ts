import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateTextContent } from '@/lib/ai';
import { CSA_DECISION_PROMPT } from '@/lib/csa/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { prompt, chatHistory = [], projectId, model = 'gemini-3.5-flash' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt wajib diisi.' },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Panjang prompt melebihi batas maksimal 2000 karakter.' },
        { status: 400 }
      );
    }

    // Retrieve the current context of the project if projectId is supplied
    let projectContext = '';
    if (projectId) {
      const { data, error } = await supabaseServer
        .from('project_state')
        .select('context_markdown')
        .eq('project_id', projectId)
        .single();

      if (!error && data?.context_markdown) {
        projectContext = data.context_markdown;
      }
    }

    // Format chat history
    let formattedHistory = '';
    if (chatHistory && chatHistory.length > 0) {
      formattedHistory = chatHistory
        .map((msg: any) => `${msg.sender === 'user' ? 'Pengguna' : 'CSA'}: ${msg.text}`)
        .join('\n\n');
    }

    // Construct structured prompt combining current context, chat history, and user query
    const combinedPrompt = `
Berikut adalah status arsitektur proyek saat ini (sebagai acuan konteks):
---
${projectContext || '(Belum ada deskripsi arsitektur proyek terdaftar)'}
---

Berikut adalah riwayat percakapan sesi brainstorming sebelumnya:
${formattedHistory || '(Belum ada riwayat percakapan)'}

Pesan terbaru dari Pengguna (jawab pesan ini dengan mempertimbangkan riwayat percakapan di atas):
${prompt}
`;

    // Query LLM with CSA decision evaluation prompt
    const aiResult = await generateTextContent({
      prompt: combinedPrompt,
      systemPrompt: CSA_DECISION_PROMPT,
      model
    });

    return NextResponse.json({
      success: true,
      text: aiResult.text,
      modelUsed: aiResult.modelUsed,
      isMock: aiResult.isMock
    });

  } catch (err: any) {
    console.error('Error in CSA brainstorm endpoint:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan saat memproses brainstorming.' },
      { status: 500 }
    );
  }
}
