import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt to query project_state table to check existence
    const { error } = await supabase.from('project_state').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          connected: true,
          status: 'table_not_found',
          message: 'Supabase API merespon, tetapi tabel "project_state" belum ada.',
          details: 'Pastikan untuk menjalankan SQL script pembuatan tabel project_state di SQL Editor Anda.'
        }, { status: 400 });
      }

      return NextResponse.json({
        connected: false,
        status: 'error',
        message: 'Gagal query tabel project_state.',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      connected: true,
      status: 'success',
      message: 'Koneksi berhasil! Tabel "project_state" terdeteksi di Supabase.'
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      status: 'exception',
      message: 'Terjadi exception saat memeriksa tabel project_state.',
      details: err.message || err
    }, { status: 500 });
  }
}
