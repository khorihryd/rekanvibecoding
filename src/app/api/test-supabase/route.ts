import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // We query a mock request to supabase.
    // If the URL or key is totally invalid, it will fail to connect.
    // If they are placeholders, it will fail but with a specific error or network error.
    // To check connection, we attempt to select count from a hypothetical projects table.
    const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

    // PostgrestError relation 'projects' does not exist is SQL code '42P01'.
    // If we receive code 42P01, it means we successfully hit the Supabase API and PostgreSQL server,
    // which confirms connection is working, but table isn't created yet (which is correct for Task 0.3).
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          connected: true,
          status: 'success',
          message: 'Koneksi ke Supabase API berhasil! Database merespon.',
          details: 'Tabel "projects" belum dibuat (Fase 1), tetapi handshake PostgreSQL berhasil.'
        });
      }

      // If we get invalid API key (401 / PGRST301 / API key invalid), it means URL is correct but key is wrong
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        return NextResponse.json({
          connected: false,
          status: 'invalid_credentials',
          message: 'Koneksi API berhasil, tetapi credentials (ANON KEY) tidak valid.',
          details: error.message
        }, { status: 401 });
      }

      return NextResponse.json({
        connected: false,
        status: 'error',
        message: 'Koneksi ke Supabase gagal.',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      connected: true,
      status: 'success',
      message: 'Koneksi berhasil dan tabel projects ditemukan!'
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      status: 'exception',
      message: 'Terjadi exception saat mencoba koneksi.',
      details: err.message || err
    }, { status: 500 });
  }
}
