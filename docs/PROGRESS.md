# Progress Tracking — CSA Chief Software Architect App

Dokumen ini melacak progres pengerjaan task berdasarkan `docs/ROADMAP.md`.

---

## Ringkasan Progres Proyek

| Fase | Deskripsi Fase | Total Task | Selesai | Progres (%) |
|---|---|---|---|---|
| **Fase 0** | Fondasi Project | 4 | 4 | 100% |
| **Fase 1** | Auth & Struktur Database | 5 | 5 | 100% |
| **Fase 2** | Integrasi GitHub | 4 | 4 | 100% |
| **Fase 3** | Otak CSA (AI Layer) | 6 | 6 | 100% |
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
- **Ringkasan:** Menulis SQL migration script untuk tabel `project_state`, mengaktifkan RLS policies berbasis kepemilikan proyek, dan membuat function serta trigger database `on_project_created` di PostgreSQL untuk otomatis membuat state awal proyek bermutu markdown saat baris proyek baru didambahkan. Membuat endpoint `/api/test-project-state` untuk verifikasi konektivitas.
- **File berubah:** `supabase/migrations/20260721092400_create_project_state.sql`, `src/app/api/test-project-state/route.ts`.
- **Catatan:** Skema relasi data diatur 1-to-1 (`project_id UNIQUE`).

---

### Fase 2 — Integrasi GitHub

#### Task 2.1 — Koneksi GitHub OAuth/App
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menyusun skema tabel `github_tokens` dan kebijakan RLS-nya. Membuat route OAuth untuk inisiasi `/api/auth/github/login` dan callback handler `/api/auth/github/callback` untuk pertukaran code ke access token. Menyediakan endpoint `/api/github/repos` dengan fallback mockup dan mengintegrasikannya ke dropdown pilihan repositori di modal pembuatan proyek baru.
- **File berubah:** `supabase/migrations/20260721094400_create_github_tokens.sql`, `src/lib/supabaseServer.ts`, `src/app/api/auth/github/login/route.ts`, `src/app/api/auth/github/callback/route.ts`, `src/app/api/github/repos/route.ts`, `src/app/dashboard/page.tsx`, `.env.example`.
- **Catatan:** Fallback mockup otomatis digunakan apabila client credentials belum siap di `.env.local` untuk mempermudah development lokal.

#### Task 2.2 — Setup webhook GitHub
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Membuat route API webhook `/api/webhook/github` untuk menerima HTTP POST push events dari GitHub. Mengurai informasi dasar seperti nama repositori, branch pembawa perubahan, nama pusher, serta rincian pesan commit yang masuk ke log console/server.
- **File berubah:** `src/app/api/webhook/github/route.ts`.
- **Catatan:** Endpoint ini mendukung request POST untuk webhook aktual dan GET untuk pemeriksaan liveness sederhana.

#### Task 2.3 — Registrasi webhook ke GitHub API
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menginstal library `octokit`. Membuat API route `/api/github/register-webhook` untuk mendaftarkan URL webhook aplikasi Next.js ke repositori GitHub target menggunakan Octokit. Mengintegrasikannya ke fungsi pembuatan proyek baru `handleCreateProject` di dashboard agar webhook otomatis terdaftar saat proyek dibuat.
- **File berubah:** `package.json`, `package-lock.json`, `src/app/api/github/register-webhook/route.ts`, `src/app/dashboard/page.tsx`.
- **Catatan:** Menyediakan fallback mockup aman jika credentials belum siap untuk dev offline.

#### Task 2.4 — Ambil isi file dari repo
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Membuat API route GET `/api/github/read-file` untuk mengambil konten berkas spesifik dari GitHub. Menguraikan URL repository, mengambil token akses, menggunakan `octokit.rest.repos.getContent` untuk request file, serta mendekode kontennya dari format base64.
- **File berubah:** `src/app/api/github/read-file/route.ts`.
- **Catatan:** Menyediakan visualisasi fallback file penting arsitektur seperti `csa-sync/context.md`, `AGENTS.md`, dan `README.md` dalam mode mockup dev offline.

---

### Fase 3 — Otak CSA (AI Layer)

#### Task 3.1 — Setup engine LLM & API client
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menginstal library inti Vercel AI SDK `ai` beserta provider `@ai-sdk/google` dan `@ai-sdk/openai`. Menyusun helper function `generateTextContent` di `src/lib/ai.ts` untuk memfasilitasi pemanggilan LLM dinamis dengan parameter temperature & system prompt, lengkap dengan mode mockup fallback jika API keys belum tersedia di `.env.local`. Membuat route test `/api/test-ai` untuk verifikasi.
- **File berubah:** `package.json`, `package-lock.json`, `src/lib/ai.ts`, `src/app/api/test-ai/route.ts`, `.env.example`.
- **Catatan:** Mode mockup otomatis menghasilkan dokumen arsitektur dan spesifikasi tugas berkualitas tinggi untuk meniru output AI yang sesungguhnya.

#### Task 3.2 — Definisikan system prompt CSA
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Menyusun konstanta system prompt modular untuk CSA di `src/lib/csa/prompts.ts`, mencakup identitas dasar, evaluasi keputusan arsitektur (brainstorming), pembuat spesifikasi tugas (task generator), serta verifikasi kepatuhan kode (git diff auditor).
- **File berubah:** `src/lib/csa/prompts.ts`.
- **Catatan:** System prompt memuat aturan ketat penolakan kode (seperti RLS bypass dan minim penanganan error database).

#### Task 3.3 — Endpoint brainstorming keputusan arsitektur
- **Status:** Selesai
- **Tanggal:** 2026-07-21
- **Ringkasan:** Membuat API route `/api/csa/brainstorm` yang menyematkan status arsitektur proyek terbaru dari tabel `project_state` ke LLM query. Memperbarui dashboard UI chat input agar langsung memanggil endpoint ini. Menambahkan tombol "Simpan Keputusan" di UI Chat untuk menyimpan langsung analisis CSA ke tabel `decisions` database Supabase, dan mengaktifkan automasi seeding keputusan awal saat proyek baru dibuat.
- **File berubah:** `src/app/api/csa/brainstorm/route.ts`, `src/app/dashboard/page.tsx`.
- **Catatan:** Integrasi decisions terhubung langsung to state rendering database di dashboard.

#### Task 3.4 — Endpoint dekomposisi task
- **Status:** Selesai
- **Tanggal:** 2026-07-22
- **Ringkasan:** Membuat API route `/api/csa/generate-task` yang mengompilasi context proyek terbaru dan semua keputusan arsitektur terdaftar, lalu memanggil Vercel AI SDK dengan `CSA_TASK_GENERATION_PROMPT` untuk memecah request pengguna menjadi spesifikasi teknis markdown. Hasil generator disimpan ke tabel `tasks` dengan status Draft. Menambahkan tombol "+ Buat Task Baru" dan modal generator di tab Kanban Board.
- **File berubah:** `src/app/api/csa/generate-task/route.ts`, `src/app/dashboard/page.tsx`.
- **Catatan:** RLS ditaati penuh. Generasi task menyertakan progress bar spinner di modal.

#### Task 3.5 — Endpoint evaluasi perbedaan kode (diff evaluator)
- **Status:** Selesai
- **Tanggal:** 2026-07-22
- **Ringkasan:** Membuat API route `/api/csa/evaluate-diff` untuk mengevaluasi perubahan kode (git diff) berdasarkan spesifikasi tugas tertentu menggunakan `CSA_VERIFICATION_PROMPT` LLM. Output dibatasi dalam format terstruktur JSON (approved, score, reasoning, feedback).
- **File berubah:** `src/app/api/csa/evaluate-diff/route.ts`.
- **Catatan:** Menyertakan ulasan mockup cerdas jika berjalan dalam offline dev mode untuk memeriksa keberadaan filter Sentry, try-catch, dan deteksi RLS bypass.

#### Task 3.6 — Endpoint update status arsitektur (context updater)
- **Status:** Selesai
- **Tanggal:** 2026-07-22
- **Ringkasan:** Membuat API route `/api/csa/update-context` yang menerima diff task yang baru saja dimerge, memprosesnya dengan LLM untuk merumuskan update ringkasan arsitektur proyek terbaru, lalu merevisi kolom `context_markdown` di tabel `project_state` database Supabase.
- **File berubah:** `src/app/api/csa/update-context/route.ts`.
- **Catatan:** Menyertakan generator mockup cerdas untuk merumuskan baris pencapaian arsitektur terupdate berdasarkan git diff jika berjalan di mode offline.

---

### Fase 4 — Task Gen & Sinkronisasi Repo

#### Task 4.1 — Sync spesifikasi task ke repository
- **Status:** Belum Selesai (Task Berikutnya)
- **Rencana Tindakan:** Membuat API route POST `/api/github/sync-task` untuk membuat branch baru `feature/task-{id}` pada repositori GitHub pengguna menggunakan Octokit, lalu melakukan commit berkas spesifikasi `csa-sync/inbox/task-{id}.md` di branch tersebut (atau ditiru jika token offline/dev).

---

## Task Berikutnya yang Akan Dikerjakan
- **Fase 4 — Task 4.1: Sync spesifikasi task ke repository**
