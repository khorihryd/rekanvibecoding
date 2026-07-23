# Roadmap & Task Breakdown
## CSA — Chief Software Architect App (MVP)

**Tujuan dokumen:** Memecah pembangunan CSA menjadi task kecil, berurutan, dan self-contained, supaya bisa dieksekusi bertahap oleh AI coding agent (satu task = satu sesi kerja).

**Cara pakai dokumen ini:**
- Kerjakan fase secara berurutan (Fase 0 → Fase 8). Jangan lompat fase.
- Dalam satu fase, kerjakan task berurutan sesuai nomor.
- Setiap task punya "Definisi Selesai" — jangan lanjut ke task berikutnya sebelum kriteria itu terpenuhi.
- Setiap task idealnya selesai dalam satu sesi AI. Kalau ternyata lebih besar dari perkiraan saat dikerjakan, berhenti dan laporkan agar dipecah lebih kecil, jangan dipaksakan lanjut.

---

## Fase 0 — Fondasi Project

**Tujuan fase:** Repo siap, stack dasar jalan, deploy pertama berhasil sebelum fitur apa pun dibangun.

### Task 0.1 — Inisialisasi project Next.js
- Buat project Next.js (App Router) + TypeScript + Tailwind
- Setup struktur folder dasar: `app/`, `lib/`, `components/`
- **Selesai jika:** `npm run dev` jalan tanpa error, halaman default tampil

### Task 0.2 — Setup repository Git & deploy awal
- Init git, push ke GitHub, connect ke Vercel
- **Selesai jika:** ada URL deploy Vercel yang bisa diakses dan menampilkan halaman default

### Task 0.3 — Setup Supabase project
- Buat project Supabase baru, simpan credential sebagai environment variable (bukan hardcode)
- Install client Supabase di project
- **Selesai jika:** aplikasi bisa konek ke Supabase (test dengan satu query sederhana, misal cek koneksi)

### Task 0.4 — Setup Sentry dasar
- Install & konfigurasi Sentry untuk Next.js
- **Selesai jika:** error sengaja (misal `throw new Error("test")`) muncul di dashboard Sentry

---

## Fase 1 — Auth & Struktur Database

**Tujuan fase:** User bisa daftar/login, dan skema database inti (bukan fitur) sudah siap dipakai fase-fase berikutnya.

### Task 1.1 — Auth dasar (signup/login)
- Pakai Supabase Auth (email/password minimal, OAuth GitHub jika mudah dilakukan sekalian karena akan dipakai untuk koneksi repo)
- **Selesai jika:** user bisa daftar, login, logout; halaman dashboard hanya bisa diakses setelah login

### Task 1.2 — Tabel `projects`
- Skema: `id, user_id, name, github_repo_url, github_installation_id, created_at`
- **Selesai jika:** user yang login bisa membuat satu project (form sederhana), tersimpan di tabel ini, RLS aktif (user hanya lihat project miliknya)

### Task 1.3 — Tabel `decisions`
- Skema: `id, project_id, decision_text, reasoning, created_at, superseded_by (nullable)`
- **Selesai jika:** tabel ada, RLS aktif, bisa insert row lewat query manual/test

### Task 1.4 — Tabel `tasks`
- Skema: `id, project_id, title, spec_markdown, status (draft|inbox|in_progress|awaiting_review|revision|approved|merged), branch_name, created_at, updated_at`
- **Selesai jika:** tabel ada, RLS aktif, bisa insert row lewat query manual/test

### Task 1.5 — Tabel `project_state`
- Skema: `id, project_id, context_markdown, updated_at` (satu row per project, representasi `context.md`)
- **Selesai jika:** tabel ada, RLS aktif, satu row otomatis terbuat saat project dibuat (kosong/template awal)

---

## Fase 2 — Integrasi GitHub

**Tujuan fase:** Aplikasi bisa membaca & menulis ke repository user.

### Task 2.1 — Koneksi GitHub OAuth/App
- Setup GitHub App atau OAuth untuk dapat akses token repo user
- Simpan token dengan aman (server-side, tidak pernah dikirim ke client)
- **Selesai jika:** user bisa "Connect GitHub" dari dashboard dan memilih satu repository

### Task 2.2 — Client Octokit dasar
- Install Octokit, buat helper function untuk: baca file dari repo, tulis/update file, buat branch, buat PR
- **Selesai jika:** ada test manual yang berhasil membaca isi satu file dari repo user yang terhubung

### Task 2.3 — Generate `AGENTS.md` awal
- Fungsi untuk push file `AGENTS.md` ke root repo user (isi: instruksi baku untuk AI Engineer membaca folder `csa-sync`)
- **Selesai jika:** saat project baru dibuat, `AGENTS.md` otomatis muncul di repo user

### Task 2.4 — Setup webhook GitHub
- Konfigurasi webhook yang trigger saat ada push/PR baru ke repo user, arahkan ke endpoint aplikasi
- **Selesai jika:** push manual ke repo test memicu log/event yang tercatat di aplikasi (belum perlu diproses, cukup diterima dulu)

---

## Fase 3 — Otak CSA (AI Layer)

**Tujuan fase:** CSA bisa brainstorming dengan user dan menghasilkan output terstruktur.

### Task 3.1 — Integrasi Vercel AI SDK
- Setup AI SDK dengan konfigurasi model bisa diganti lewat environment variable/config, bukan hardcode
- **Selesai jika:** ada satu endpoint test yang berhasil memanggil model dan menerima respons teks

### Task 3.2 — UI chat brainstorming
- Halaman chat sederhana antara user dan CSA, terhubung ke satu project
- **Selesai jika:** user bisa kirim pesan dan menerima balasan dari model, riwayat tampil di layar (belum perlu disimpan permanen di task ini)

### Task 3.3 — Auto-save keputusan ke tabel `decisions`
- Setelah tiap balasan CSA, jalankan proses (lewat prompt terpisah atau structured output) untuk mendeteksi apakah ada keputusan konkret baru → simpan ke tabel `decisions`
- **Selesai jika:** brainstorming yang menghasilkan keputusan jelas (contoh: "pakai Next.js") otomatis tersimpan sebagai row baru, terlihat di database

### Task 3.4 — Reload state di awal sesi
- Saat user buka chat project yang sudah ada, sistem fetch `decisions` dan `project_state` terbaru, inject sebagai konteks awal sebelum percakapan lanjut
- **Selesai jika:** setelah refresh/buka ulang, CSA bisa merujuk keputusan lama tanpa user mengulang penjelasan

### Task 3.5 — Generate PRD & BRD dari hasil brainstorming
- Fungsi/tombol "Generate PRD & BRD" yang meringkas seluruh `decisions` project jadi dua dokumen terstruktur
- **Selesai jika:** output PRD & BRD tersimpan (tabel baru `documents` atau kolom di `projects`) dan bisa ditampilkan di UI

### Task 3.6 — Mekanisme konfirmasi pemahaman
- Sebelum sistem menyimpan sebuah keputusan baru ke tabel `decisions` (Task 3.3), tambahkan langkah wajib: CSA merangkum pemahamannya dengan kalimat sendiri dan meminta user konfirmasi eksplisit ("betul begitu?") sebelum keputusan tersimpan
- **Selesai jika:** dalam skenario test, keputusan baru tidak langsung tersimpan sebelum ada konfirmasi user yang jelas terhadap rangkuman CSA

---

## Fase 4 — Task Generation & Sinkronisasi Repo

**Tujuan fase:** CSA bisa memecah PRD jadi task kecil dan menulis ke repo dalam format yang bisa dibaca AI Engineer mana pun.

### Task 4.1 — Generate daftar task dari PRD
- Fungsi yang mengambil PRD tersimpan, memecahnya jadi beberapa task kecil (judul + spec), simpan ke tabel `tasks` dengan status `draft`
- **Selesai jika:** dari satu PRD contoh, muncul beberapa row task baru dengan spec yang masuk akal

### Task 4.2 — Format & push task ke `csa-sync/inbox`
- Untuk task berstatus `draft` yang di-approve user, generate file markdown (format baku, lihat catatan struktur di bawah) dan push ke `csa-sync/inbox/task-{id}.md` di repo, ubah status jadi `inbox`
- **Selesai jika:** file muncul di repo GitHub user dengan format yang benar

### Task 4.3 — Generate & update `context.md`
- Fungsi yang menulis ulang `csa-sync/context.md` berdasarkan `project_state` + `decisions` terbaru setiap kali ada task baru di-push atau task disetujui
- **Selesai jika:** isi file di repo selalu sinkron dengan state terbaru di database setelah aksi terkait

### Task 4.4 — Format laporan outbox (kontrak untuk AE)
- Finalisasi format markdown baku untuk `csa-sync/outbox/report-{id}.md` (field wajib: task_id, status, ringkasan perubahan, file yang diubah, catatan untuk CSA)
- Tulis format ini juga ke `AGENTS.md` supaya AE tahu wajib menulis laporan sesuai format ini
- **Selesai jika:** `AGENTS.md` dan dokumentasi internal aplikasi memuat format yang identik

### Task 4.5 — Cek konflik untuk permintaan fitur baru di tengah project
- Saat user mengajukan fitur baru lewat sesi brainstorming (bukan project baru), tambahkan langkah: sebelum generate task, bandingkan permintaan dengan `decisions` dan `project_state` yang ada (lewat prompt ke model AI: "apakah permintaan ini bertentangan dengan keputusan berikut?")
- Kalau terdeteksi potensi konflik, tampilkan ke user secara eksplisit di chat sebelum lanjut generate task, minta konfirmasi cara penyelesaiannya
- Setelah user konfirmasi, simpan PRD sebagai versi baru (jangan overwrite versi lama — tambah kolom/tabel versioning bila belum ada), lalu lanjutkan proses generate task seperti biasa (Task 4.1-4.2)
- **Selesai jika:** skenario test (fitur baru yang sengaja dibuat bertentangan dengan keputusan lama) berhasil terdeteksi dan ditampilkan ke user sebelum task dibuat

---

## Fase 5 — Mesin Verifikasi

**Tujuan fase:** CSA bisa membaca hasil kerja AE secara objektif dan memutuskan approve/reject.

### Task 5.1 — Proses webhook jadi event task
- Saat webhook menerima push ke branch task tertentu, update status task jadi `in_progress`, catat commit terbaru
- **Selesai jika:** push manual ke branch task memicu perubahan status yang benar di dashboard/database

### Task 5.2 — Baca hasil GitHub Actions
- Fungsi untuk polling/membaca status check run terbaru dari commit terkait (lolos/gagal test)
- **Selesai jika:** hasil test (pass/fail) dari repo test berhasil terbaca dan tersimpan terkait task tersebut

### Task 5.3 — Baca file `outbox` terkait task
- Fungsi untuk membaca isi `report-{id}.md` yang ditulis AE, parsing field-fieldnya
- **Selesai jika:** isi laporan AE (dari repo test) berhasil terbaca dan tersimpan/ditampilkan terstruktur

### Task 5.4 — Review otomatis oleh CSA
- Kirim ke model AI: diff kode terkait + hasil test + isi `context.md` + spec task asli → minta model menilai konsistensi & kelengkapan, hasilkan keputusan approve/reject + alasan
- **Selesai jika:** untuk satu task test (sengaja dibuat benar & satu dibuat cacat), CSA menghasilkan keputusan yang sesuai ekspektasi

### Task 5.5 — Generate task koreksi otomatis saat reject
- Kalau CSA reject, generate file task baru ke `inbox` berisi instruksi perbaikan spesifik (bukan cuma "ditolak"), update status task lama jadi `revision`
- **Selesai jika:** task cacat dari 5.4 menghasilkan file koreksi baru yang jelas di `inbox`

### Task 5.6 — Deteksi anomali konteks
- Cek sederhana: apakah commit menghapus/mengubah drastis file yang sudah "selesai" sebelumnya (bandingkan dengan riwayat task `merged`) → kalau ya, tandai sebagai anomali dan sertakan peringatan di task koreksi
- **Selesai jika:** skenario simulasi (AE menghapus fitur lama) berhasil terdeteksi dan menghasilkan task koreksi dengan catatan anomali

---

## Fase 6 — Dashboard & Status Tracking

**Tujuan fase:** User bisa memantau seluruh progres tanpa buka GitHub manual.

### Task 6.1 — Halaman daftar task dengan status
- Tampilkan semua task project dengan status berwarna (draft, inbox, in_progress, awaiting_review, revision, approved, merged)
- **Selesai jika:** perubahan status di database langsung terlihat di halaman ini

### Task 6.2 — Detail task
- Klik satu task menampilkan spec asli, riwayat status, hasil review CSA, link ke branch/PR di GitHub
- **Selesai jika:** semua informasi ini tampil benar untuk task yang sudah diproses fase sebelumnya

### Task 6.3 — Tampilan `context.md` & riwayat `decisions`
- Halaman terpisah menampilkan isi context project saat ini dan daftar keputusan historis
- **Selesai jika:** data yang tampil sesuai isi database/repo terbaru

### Task 6.4 — Notifikasi anomali & revisi
- Badge/notifikasi sederhana saat ada task revisi baru atau anomali terdeteksi
- **Selesai jika:** notifikasi muncul saat kondisi tersebut terjadi di data test

---

## Fase 7 — Audit Gate & Merge

**Tujuan fase:** Menutup loop sampai kode benar-benar masuk ke branch main.

### Task 7.1 — Checklist audit per task
- Saat task berstatus `approved` (lolos verifikasi CSA), generate checklist audit visual spesifik (bukan generik) berdasarkan spec task
- **Selesai jika:** checklist yang muncul relevan dengan task terkait, bukan template generik

### Task 7.2 — UI konfirmasi audit user
- User mencentang checklist, opsional catatan, tombol "Setujui untuk merge"
- **Selesai jika:** status task berubah jadi siap-merge setelah user submit form ini

### Task 7.3 — Eksekusi merge ke branch main
- Setelah user approve, panggil Octokit untuk merge PR/branch terkait ke main, update status task jadi `merged`
- **Selesai jika:** kode benar-benar masuk ke branch main di repo user, status ter-update

### Task 7.4 — Catatan environment/secrets manual
- Field di UI untuk user mencatat setup environment yang sudah/perlu dilakukan (misal API key pihak ketiga), terhubung ke task terkait
- **Selesai jika:** catatan ini tersimpan dan terlihat di detail task

---

## Fase 7.5 — Mode Self-Hosted vs Hosted & Sistem Token

**Tujuan fase:** Mendukung monetisasi platform melalui kuota token (mode Hosted) dan opsi bring-your-own-key (mode Self-Hosted yang 100% gratis dari biaya platform) untuk fleksibilitas pengguna.

### Task 7.5.1 — Skema Database & Model Token
- Buat skema tabel `tokens` dan kolom pencatatan kuota transaksi pemakaian API LLM per proyek/user (khusus untuk pencatatan di mode Hosted).
- **Selesai jika:** tabel kuota terbuat di Supabase, RLS aktif, dan relasi data token/pemakaian terverifikasi.

### Task 7.5.2 — Konfigurasi Mode Self-Hosted (API Key User)
- Bangun UI form input API Key LLM personal (OpenAI / Gemini) pada dashboard pengaturan proyek dan simpan secara terenkripsi.
- **Selesai jika:** API key dapat disimpan oleh pengguna dan divalidasi keaktifannya.

### Task 7.5.3 — Konfigurasi Mode Hosted (Sistem Token Admin)
- Implementasikan pemotongan saldo token pengguna saat menggunakan endpoint AI bawaan dari platform CSA. Logika pemotongan token ini harus sepenuhnya dinonaktifkan di mode Self-Hosted.
- **Selesai jika:** transaksi kredit token terpotong otomatis setiap kali memicu request AI hosted, sedangkan pada mode Self-Hosted berjalan bypass tanpa pemotongan saldo.

### Task 7.5.4 — Middleware Pembatasan Akses & Token Check
- Buat middleware verifikasi sisa kuota token (untuk mode Hosted) atau ketersediaan personal API key (untuk mode Self-Hosted) sebelum mengizinkan request API routes arsitektur.
- **Selesai jika:** request diblokir otomatis dengan kode error 402/403 saat token habis pada mode Hosted, sedangkan pada mode Self-Hosted request dilayani gratis tanpa pemotongan selama personal API key terisi dan valid.

### Task 7.5.5 — UI Dashboard Saldo & Token Usage
- Tambahkan card visual untuk memantau status pemakaian token, riwayat transaksi kuota (khusus mode Hosted), serta toggle switcher/mode deployment.
- **Selesai jika:** widget menampilkan data saldo/pemakaian secara reaktif di mode Hosted, dan menampilkan informasi status "Self-Hosted: Aktif & Gratis" di mode Self-Hosted.

### Task 7.5.6 — Switcher Mode Deployment & Uji Validasi
- Sediakan switcher global di dashboard untuk mengubah status proyek dari mode hosted ke self-hosted beserta pengujian E2E kedua mode.
- **Selesai jika:** transisi mode mengubah target endpoint AI dan skema pemotongan token/personal key secara instan tanpa downtime.

---

## Fase 8 — Hardening & Monitoring

**Tujuan fase:** Persiapan sebelum dipakai untuk project nyata (dogfooding).

### Task 8.1 — Error handling menyeluruh
- Review semua endpoint API dan fungsi utama, pastikan ada try-catch dan pesan error yang jelas ke user
- **Selesai jika:** simulasi error (misal token GitHub invalid) menampilkan pesan yang jelas, bukan crash polos

### Task 8.2 — Rate limiting & validasi input
- Tambahkan validasi input di semua form dan endpoint yang menerima data user
- **Selesai jika:** input kosong/tidak valid ditolak dengan pesan jelas, tidak menyebabkan error tak tertangani

### Task 8.3 — Review keamanan RLS & credential
- Audit ulang semua tabel Supabase untuk RLS, pastikan tidak ada API key/token yang ter-expose ke client
- **Selesai jika:** pengecekan eksplisit dilakukan dan didokumentasikan, semua ditemukan celah sudah diperbaiki

### Task 8.4 — Uji end-to-end satu project nyata
- Jalankan seluruh alur (brainstorming → PRD/BRD → task → AE kerja → verifikasi → audit → merge) untuk satu project sungguhan
- **Selesai jika:** minimal satu fitur nyata berhasil melewati seluruh alur sampai merge ke main

---

## Catatan Format File `csa-sync` (Referensi untuk Task 4.2 & 4.4)

```
/csa-sync/
  inbox/
    task-{id}.md      → berisi: judul, ringkasan context project, spec detail, acceptance criteria, referensi ke context.md
  outbox/
    report-{id}.md    → berisi: task_id, status, ringkasan perubahan, file yang diubah, catatan untuk CSA
  context.md           → ringkasan state project terkini, selalu ditulis ulang oleh CSA (bukan oleh AE)
AGENTS.md              → instruksi baku di root repo: wajib baca context.md + task aktif sebelum kerja, format laporan wajib
```

## Prinsip Saat Mengeksekusi Roadmap Ini

- Jangan mulai fase baru sebelum semua task di fase sebelumnya memenuhi "Definisi Selesai"-nya.
- Kalau satu task ternyata perlu diubah scope-nya di tengah eksekusi, catat perubahan itu sebagai keputusan baru (lihat prinsip PRD sebagai dokumen hidup), jangan diam-diam menyimpang dari spec.
- Commit ke Git di akhir setiap task yang selesai, jangan menumpuk banyak task dalam satu commit besar.
