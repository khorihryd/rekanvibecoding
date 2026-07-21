'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };
    handleRedirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#07090e] text-[#f8fafc]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
    </div>
  );
}
