import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';

export const dynamic = 'force-dynamic';

const MOCK_FILES: Record<string, string> = {
  'csa-sync/context.md': `# CSA Project Context: rekanvibecoding

## Deskripsi
Platform kolaborasi visual AI untuk vibe coding, mengintegrasikan CSA sebagai pengawas arsitektur.

## Teknologi Utama
- Next.js 16 (App Router, React 19)
- Tailwind CSS v4
- Supabase (Auth, RLS, DB)
- Sentry (Error Tracking)
- Vercel AI SDK
- Octokit (GitHub Client SDK)

## Arsitektur & Aturan
- Seluruh state disimpan di Database Supabase
- CSA & AE bertukar data via repository (\`/csa-sync/\`)
- Git Branching: main (release) & feature/task-{id} (development)

## Status Terakhir
- Project diinisialisasi (Task 0.1)
- Setup Supabase & skema tabel selesai (Task 0.3, Task 1.1)
- Hubungkan repositori GitHub & registrasi Webhook (Task 2.1 - 2.3)`,
  
  'AGENTS.md': `# AGENTS.md

Instruksi ini wajib dibaca oleh AI coding agent sebelum menyentuh kode di repository ini.

## Dokumen Sumber Kebenaran
Sebelum mengerjakan apa pun, baca urutan berikut:
1. \`docs/PRD.md\` — requirement produk, fitur, dan alur pengguna
2. \`docs/BRD.md\` — tujuan bisnis, batasan, dan risiko
3. \`docs/ROADMAP.md\` — daftar task berurutan per fase, lengkap dengan "Definisi Selesai"
4. \`docs/PROGRESS.md\` — checklist task mana yang sudah selesai

## Aturan Wajib
1. Kerjakan HANYA SATU task dari ROADMAP.md per sesi.
2. Sebelum mulai kerja, cek PROGRESS.md untuk tahu task terakhir yang selesai.
3. Setelah task selesai, update PROGRESS.md.`,
  
  'README.md': `# CSA Chief Software Architect

Aplikasi asisten pemrograman AI untuk merancang arsitektur, verifikasi otomatis kode, dan sinkronisasi repositori GitHub.`
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const repoUrl = searchParams.get('repoUrl');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref') || '';

    if (!userId || !repoUrl || !path) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId, repoUrl, dan path wajib diisi.' },
        { status: 400 }
      );
    }

    // Parse owner and repo name from GitHub URL
    let owner = '';
    let repo = '';

    if (repoUrl.includes('github.com/')) {
      const parts = repoUrl.split('github.com/')[1].split('/');
      owner = parts[0];
      repo = parts[1]?.replace('.git', '');
    } else if (repoUrl.includes('/')) {
      const parts = repoUrl.split('/');
      owner = parts[0];
      repo = parts[1];
    }

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Format URL repositori GitHub tidak valid.' },
        { status: 400 }
      );
    }

    // Fetch user access token from Supabase using server role client
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from('github_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    // Fallback Mock Mode: if token is not found or client ID is missing
    if (tokenError || !tokenData?.access_token || !process.env.GITHUB_CLIENT_ID) {
      // Return mock content depending on path
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      const content = MOCK_FILES[normalizedPath] || `# Mock Content for ${normalizedPath}\n\nThis is mockup content for testing purposes. Generated offline because GitHub connection credentials are not ready.`;
      
      console.log(`[File Read Mock Mode] Membaca file mockup: ${normalizedPath} untuk ${owner}/${repo}`);
      return NextResponse.json({
        success: true,
        isMock: true,
        owner,
        repo,
        path: normalizedPath,
        content,
        message: 'Konten file dibaca dalam mode mockup.'
      });
    }

    const accessToken = tokenData.access_token;
    const octokit = new Octokit({ auth: accessToken });

    console.log(`[File Read] Membaca file ${path} dari repositori ${owner}/${repo} (ref: ${ref || 'default'})`);

    // Call GitHub API to get file content
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: ref || undefined
    });

    // Verify response is a single file
    if (Array.isArray(response.data)) {
      return NextResponse.json(
        { success: false, error: 'Path tersebut menunjuk ke direktori, bukan file.' },
        { status: 400 }
      );
    }

    if (response.data.type !== 'file') {
      return NextResponse.json(
        { success: false, error: 'Path tersebut bukan tipe file yang valid.' },
        { status: 400 }
      );
    }

    // Decode base64 content returned by GitHub API
    const content = Buffer.from(response.data.content, 'base64').toString('utf8');

    return NextResponse.json({
      success: true,
      isMock: false,
      owner,
      repo,
      path,
      content,
      sha: response.data.sha
    });

  } catch (err: any) {
    console.error('Error reading file from GitHub:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal membaca berkas di GitHub.' },
      { status: 500 }
    );
  }
}
