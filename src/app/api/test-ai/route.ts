import { NextResponse } from 'next/server';
import { generateTextContent } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt') || 'Jelaskan mengapa modularitas penting dalam arsitektur software.';
    const model = searchParams.get('model') || 'gemini-3.5-flash';

    const result = await generateTextContent({
      prompt,
      model,
      systemPrompt: 'You are a strict, senior software architect reviewing system design.'
    });

    return NextResponse.json({
      success: true,
      prompt,
      ...result
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || err
    }, { status: 500 });
  }
}
