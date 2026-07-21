# Product Requirements Document (PRD)
## CSA — Chief Software Architect App

**Versi dokumen:** 1.0
**Status:** Draft awal untuk eksekusi MVP
**Scope:** Single project per user (multi-project ditunda ke fase berikutnya)

---

## 1. Latar Belakang & Masalah

Vibe coder non-teknis menggunakan AI (Cursor, Codex, Claude Code, dll) untuk membangun produk, tapi sering menghasilkan "AI slop" — aplikasi yang kelihatan jalan tapi rapuh, karena:

- Tidak ada yang menjaga konsistensi arsitektur lintas sesi AI
- Tidak ada verifikasi sistematis (security, testing, error handling) sebelum kode di-merge
- User non-teknis tidak tahu apa yang harus direview atau ditanyakan
- Konteks kerja hilang setiap kali ganti tool AI atau mulai sesi baru

CSA menjawab ini dengan berperan sebagai "tech lead AI" yang merencanakan, memecah task, memverifikasi hasil kerja AI Engineer (AE), dan menjaga satu sumber kebenaran project — tanpa pernah terhubung langsung secara API ke AE, hanya lewat repository GitHub.

## 2. Tujuan Produk

- Memungkinkan user non-teknis membangun software matang lewat AI, dengan pengawasan otomatis terhadap kualitas dan konsistensi
- Menjamin setiap perubahan kode diverifikasi sebelum masuk ke branch utama
- Menjaga project tetap bisa dilanjutkan oleh AI Engineer apa pun, kapan pun, tanpa kehilangan konteks

## 3. Target Pengguna

Founder/individu non-teknis yang membangun web app (SaaS/dashboard) sendirian menggunakan AI coding agent, dan ingin hasil akhirnya layak dipublikasikan — bukan sekadar prototipe.

## 4. Definisi Peran dalam Sistem

| Peran | Deskripsi |
|---|---|
| **User** | Pemilik produk. Brainstorming ide dengan CSA, melakukan audit visual, setup environment/secrets, approve keputusan besar. |
| **CSA** | Aplikasi ini. Menyusun PRD/BRD, memecah task, menulis instruksi ke repo, memverifikasi hasil kerja AE, mengelola state project. |
| **AI Engineer (AE)** | AI coding agent pilihan user (Cursor, Codex, Claude Code, dll). Membaca task dari repo, menulis kode di branch terpisah, melapor lewat repo. Tidak pernah terhubung langsung ke CSA. |

## 5. Prinsip Arsitektur Inti (Non-Negotiable)

1. **CSA dan AE tidak pernah berkomunikasi lewat API langsung** — hanya lewat file di repository GitHub (folder `csa-sync`).
2. **Semua state penting hidup di database/repo, tidak pernah hanya di context window AI** — baik untuk AE maupun CSA sendiri.
3. **Verifikasi berbasis bukti (kode, hasil CI), bukan klaim laporan.**
4. **Task harus self-contained** — bisa dikerjakan AE mana pun tanpa perlu riwayat percakapan sebelumnya.
5. **PRD/BRD adalah dokumen hidup (versioned), bukan beku** — perubahan requirement dikelola eksplisit, bukan diabaikan.

## 6. Fitur MVP (Scope Fase 1)

### 6.1 Brainstorming & Spec Generation
- Chat interface user ↔ CSA untuk brainstorming ide
- CSA wajib merangkum pemahamannya dengan kalimat sendiri dan meminta konfirmasi user ("Jadi yang kamu maksud adalah... betul?") sebelum melanjutkan ke keputusan berikutnya — bukan langsung mengasumsikan paham dari satu-dua kalimat
- CSA menyusun PRD, BRD, dan daftar task dari hasil brainstorming
- Setiap keputusan konkret yang tercapai langsung disimpan ke database (bukan menunggu sesi selesai)

### 6.2 Task & Sync Management
- CSA generate file task ke `/csa-sync/inbox/` di repo GitHub milik user
- CSA generate `AGENTS.md` di root repo (sekali di awal project) berisi instruksi standar untuk AI Engineer
- CSA generate dan mengelola `/csa-sync/context.md` — ringkasan state project yang selalu ter-update

### 6.3 Verifikasi Otomatis
- Baca branch & commit lewat GitHub API (Octokit)
- Baca hasil GitHub Actions (test otomatis) sebagai bukti objektif, bukan klaim AE
- Bandingkan hasil kerja AE dengan task spec dan `context.md` (cek konsistensi arsitektur)
- Approve → merge ke branch main, atau Reject → generate task koreksi baru ke inbox

### 6.4 Dashboard Status
- Daftar task: draft, dikerjakan, menunggu verifikasi, revisi, disetujui, selesai
- Tampilan `context.md` dan riwayat keputusan (`decisions`)
- Notifikasi kalau CSA mendeteksi anomali (progress mundur, konflik keputusan)

### 6.5 Penambahan Fitur di Tengah Project
- User bisa membuka kembali sesi brainstorming kapan pun untuk mengajukan fitur/perubahan baru, bukan menulis prompt langsung ke AI Engineer
- CSA menggali maksud user lebih dalam (alasan, relasi dengan fitur yang sudah ada) sebelum menyusun task, mengikuti prinsip konfirmasi pemahaman di 6.1
- CSA memeriksa permintaan baru terhadap `decisions` dan `context.md` yang sudah ada untuk mendeteksi potensi konflik (misalnya perubahan skema yang dipakai fitur lain) sebelum task ditulis
- Kalau ditemukan konflik, CSA menyampaikannya eksplisit ke user untuk diputuskan, bukan diam-diam menimpa keputusan lama
- PRD di-update sebagai versi baru (bukan menimpa versi sebelumnya) sesuai prinsip dokumen hidup di bagian 5
- Task hasil dari permintaan baru mengikuti proses generation & sinkronisasi yang sama seperti task reguler (lihat 6.2)

### 6.6 User Audit Gate
- Setelah CSA approve teknis, user diminta melakukan audit visual dengan checklist spesifik per task (bukan instruksi generik)
- User menandai setup environment/secrets yang tidak bisa dikerjakan AE/CSA
- Merge ke branch main baru terjadi setelah audit user selesai

## 7. Non-Goals (Di Luar Scope MVP)

- Multi-project dalam satu akun (ditunda)
- Runtime orkestrasi custom yang memanggil AE secara langsung
- Deploy otomatis ke production (fase MVP berhenti di merge ke main)
- Dukungan penuh untuk semua AI coding tool — awal fokus ke pola yang generic (file-based), bukan integrasi API khusus tiap tool

## 8. Alur Pengguna Utama (User Flow)

1. User buat akun & connect repository GitHub
2. User brainstorming ide dengan CSA → CSA hasilkan PRD, BRD, task pertama
3. CSA push `AGENTS.md`, `context.md`, dan task pertama ke repo
4. User buka AI tool pilihannya, minta AE cek task baru
5. AE kerja di branch, push perubahan, tulis laporan ke outbox
6. CSA deteksi push (webhook), baca kode & hasil test, verifikasi
7. Jika reject → CSA tulis task koreksi baru ke inbox, kembali ke langkah 4
8. Jika approve → user audit visual & environment
9. User approve → merge ke branch main
10. Lanjut ke task berikutnya (kembali ke langkah 3)

### 8.1 Sub-Alur: Penambahan Fitur di Tengah Project

Bisa terjadi kapan pun di antara langkah 4-10 di atas:

1. User buka kembali sesi brainstorming CSA, sampaikan kebutuhan fitur baru
2. CSA klarifikasi maksud user (konfirmasi pemahaman) sebelum lanjut
3. CSA cek `decisions` dan `context.md` untuk potensi konflik dengan keputusan/fitur yang sudah ada
4. Jika ada konflik → CSA sampaikan ke user untuk diputuskan bersama sebelum lanjut
5. CSA update PRD sebagai versi baru, generate task baru dari hasil diskusi
6. Task baru mengikuti proses normal (push ke inbox → dikerjakan AE → verifikasi → audit → merge, kembali ke langkah 4-10 alur utama)

## 9. Metrik Keberhasilan (MVP)

- % task yang berhasil di-merge tanpa lebih dari 2x revisi
- Waktu rata-rata dari task dibuat sampai di-merge
- Jumlah anomali konteks yang berhasil dideteksi otomatis (bukan ditemukan manual oleh user)
- Retensi: apakah user menyelesaikan minimal 1 project penuh sampai merge

## 10. Ketergantungan Teknis Utama

Next.js + Vercel, Supabase (Postgres + Auth + RLS), Vercel AI SDK (model-agnostic), Octokit + GitHub Actions + Webhook, Sentry. Detail lebih lanjut ada di dokumen roadmap teknis.

## 11. Riwayat Perubahan Dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | Draft awal | Versi pertama hasil brainstorming |
| 1.1 | Revisi | Tambah mekanisme konfirmasi pemahaman (6.1), fitur penambahan di tengah project & cek konflik (6.5), sub-alur user flow (8.1) |
