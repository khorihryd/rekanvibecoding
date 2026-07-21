import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt to query decisions table to check existence
    const { error } = await supabase.from('decisions').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          connected: true,
          status: 'table_not_found',
          message: 'Supabase API merespon, tetapi tabel "decisions" belum ada.',
          details: 'Pastikan untuk menjalankan SQL script pembuatan tabel decisions di SQL Editor Anda.'
        }, { status: 400 });
      }

      return NextResponse.json({
        connected: false,
        status: 'error',
        message: 'Gagal query tabel decisions.',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      connected: true,
      status: 'success',
      message: 'Koneksi berhasil! Tabel "decisions" terdeteksi di Supabase.'
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      status: 'exception',
      message: 'Terjadi exception saat memeriksa tabel decisions.',
      details: err.message || err
    }, { status: 500 });
  }
}
