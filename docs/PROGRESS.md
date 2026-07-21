# Progress Tracking — CSA Chief Software Architect App

Dokumen ini melacak progres pengerjaan task berdasarkan `docs/ROADMAP.md`.

---

## Ringkasan Progres Proyek

| Fase | Deskripsi Fase | Total Task | Selesai | Progres (%) |
|---|---|---|---|---|
| **Fase 0** | Fondasi Project | 4 | 4 | 100% |
| **Fase 1** | Auth & Struktur Database | 5 | 5 | 100% |
| **Fase 2** | Integrasi GitHub | 4 | 0 | 0% |
| **Fase 3** | Otak CSA (AI Layer) | 6 | 0 | 0% |
| **Fase 4** | Task Gen & Sinkronisasi Repo | 5 | 0 | 0% |
| **Fase 5** | Mesin Verifikasi | 6 | 0 | 0% |
| **Fase 6** | Dashboard & Status Tracking | 4 | 0 | 0% |
| **Fase 7** | Audit Gate & Merge | 4 | 0 | 0% |
| **Fase 8** | Hardening & Monitoring | 4 | 0 | 0% |

---

## Log Detail Task

### Fase 0 — Fondasi Project

#### Task 0.1 — Inisialisasi project Next.js
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Inisialisasi Next.js 16 (App Router) dengan TypeScript, ESLint, dan Tailwind CSS v4. Struktur folder dasar `/src/app` telah terbentuk.
- **File berubah:** `package.json`, `tsconfig.json`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`.
- **Catatan:** Disimpulkan dari review kode awal (tidak dikerjakan sesi ini).

#### Task 0.2 — Setup repository Git & deploy awal
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Git repository telah diinisialisasi secara lokal dengan konfigurasi `.gitignore` bawaan.
- **File berubah:** `.git/`, `.gitignore`.
- **Catatan:** Disimpulkan dari review kode awal (tidak dikerjakan sesi ini).

#### Task 0.3 — Setup Supabase project
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menginstal `@supabase/supabase-js`, mengonfigurasi client di `src/lib/supabase.ts`, menyediakan berkas template `.env.example`, dan membuat API route `/api/test-supabase` untuk pengujian koneksi.
- **File berubah:** `package.json`, `package-lock.json`, `.env.example`, `src/lib/supabase.ts`, `src/app/api/test-supabase/route.ts`.
- **Catatan:** Handshake berhasil divalidasi ke database nyata dengan credential `.env.local` milik user.

#### Task 0.4 — Setup Sentry dasar
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menginstal `@sentry/nextjs`, mengonfigurasi SDK untuk client, server, dan edge, serta menambahkan endpoint test `/api/test-sentry` untuk memicu exception secara sengaja dan menangkapnya di Sentry.
- **File berubah:** `package.json`, `package-lock.json`, `next.config.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/api/test-sentry/route.ts`.
- **Catatan:** Memperbaiki masalah compile font Turbopack dengan menghapus `@next/font/google` dan menggunakan native system font stack.

---

### Fase 1 — Auth & Struktur Database

#### Task 1.1 — Auth dasar (signup/login)
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Membuat form login & pendaftaran di `/login` dengan visualisasi premium, mengamankan rute dashboard `/dashboard` dengan redirect otomatis client-side, dan memperbarui sidebar profile dengan email dan tombol logout.
- **File berubah:** `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/dashboard/page.tsx`.
- **Catatan:** Menggunakan client-side session routing.

#### Task 1.2 — Tabel `projects`
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menulis SQL migration script untuk tabel `projects` dan RLS policies, mengintegrasikan pengambilan data proyek dinamis dari Supabase, menambahkan tampilan selamat datang jika belum ada proyek, dan membuat form modal glassmorphism untuk pendaftaran proyek baru.
- **File berubah:** `supabase/migrations/20260721091000_create_projects.sql`, `src/app/dashboard/page.tsx`.
- **Catatan:** RLS diatur sehingga pengguna hanya dapat berinteraksi dengan data proyek milik mereka sendiri (`auth.uid() = user_id`).

#### Task 1.3 — Tabel `decisions`
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menulis SQL migration script untuk tabel `decisions` dengan foreign key reference ke projects dan self-reference (superseded_by), serta mengonfigurasi RLS policies berbasis kepemilikan proyek. Membuat endpoint `/api/test-decisions` untuk verifikasi konektivitas.
- **File berubah:** `supabase/migrations/20260721091700_create_decisions.sql`, `src/app/api/test-decisions/route.ts`.
- **Catatan:** RLS policy memverifikasi kepemilikan proyek pengguna via `EXISTS` check pada tabel `projects` (`projects.user_id = auth.uid()`).

#### Task 1.4 — Tabel `tasks`
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menulis SQL migration script untuk tabel `tasks` (dengan check constraint status enum) dan project-scoped RLS policies. Membuat endpoint `/api/test-tasks` untuk verifikasi konektivitas.
- **File berubah:** `supabase/migrations/20260721092200_create_tasks.sql`, `src/app/api/test-tasks/route.ts`.
- **Catatan:** RLS policy memverifikasi kepemilikan proyek pengguna via `EXISTS` check pada tabel `projects` (`projects.user_id = auth.uid()`).

#### Task 1.5 — Tabel `project_state`
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menulis SQL migration script untuk tabel `project_state`, mengaktifkan RLS policies berbasis kepemilikan proyek, dan membuat function serta trigger database `on_project_created` di PostgreSQL untuk otomatis membuat state awal proyek bermutu markdown saat baris proyek baru ditambahkan. Membuat endpoint `/api/test-project-state` untuk verifikasi konektivitas.
- **File berubah:** `supabase/migrations/20260721092400_create_project_state.sql`, `src/app/api/test-project-state/route.ts`.
- **Catatan:** Skema relasi data diatur 1-to-1 (`project_id UNIQUE`).

---

## Task Berikutnya yang Akan Dikerjakan
- **Fase 2 — Task 2.1: Koneksi GitHub OAuth/App**
