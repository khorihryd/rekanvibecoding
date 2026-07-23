# Task Koreksi — Hasil Review Repo rekanvibecoding

Dokumen ini berisi task koreksi atas temuan review terhadap `docs/PROGRESS.md` yang mengklaim 100% selesai, padahal tiga bagian krusial masih simulasi/mock. Kerjakan berurutan, satu task per sesi, ikuti aturan di `AGENTS.md` (jangan lompat, update `PROGRESS.md` setelah tiap task selesai).

---

## Koreksi 1 — Implementasikan Merge Sungguhan ke Branch Main

**Masalah:** `handleMergeToMain` di `src/app/dashboard/page.tsx` hanya mengubah kolom `status` task menjadi `merged` di Supabase. Tidak ada panggilan GitHub API yang benar-benar menggabungkan branch task ke branch main — log yang tampil (`[Octokit] Memanggil API GitHub: merge branch... (mocked in offline mode)`) adalah teks statis, bukan hasil eksekusi nyata.

**Definisi Selesai:**
- Buat endpoint baru (misalnya `/api/github/merge-task`) yang memanggil `octokit.rest.pulls.create()` (jika PR belum ada) lalu `octokit.rest.pulls.merge()` untuk branch task terkait ke default branch repo
- `handleMergeToMain` di dashboard memanggil endpoint ini, bukan hanya update status database secara langsung
- Update status task ke `merged` di Supabase **hanya setelah** API merge dari GitHub mengonfirmasi sukses (bukan sebelum atau sejajar)
- Tangani kasus gagal (misal konflik merge) dengan pesan error jelas ke user, status task TIDAK berubah jadi `merged` jika gagal
- Sediakan mode mockup yang jujur untuk dev offline (boleh tetap ada), tapi log/pesan harus jelas membedakan "berhasil di-mock untuk testing" vs "berhasil di-merge sungguhan" — jangan pakai kalimat yang terkesan sudah nyata padahal mock
- Uji end-to-end dengan repo/token GitHub nyata: buat branch dan PR test, jalankan alur approve & merge, verifikasi branch benar-benar ter-merge di GitHub (cek lewat GitHub UI atau API, bukan cuma database aplikasi)

---

## Koreksi 2 — Verifikasi CSA Wajib Baca Hasil GitHub Actions/CI Sungguhan

**Masalah:** `verify-task/route.ts` hanya mengevaluasi diff kode dengan keyword matching sederhana (cek string `service_role`, `try`, `catch`, `sentry`) dan opini model AI. Tidak ada pembacaan status check run/GitHub Actions sama sekali — bertentangan dengan prinsip "verifikasi berbasis bukti CI, bukan klaim/opini".

**Definisi Selesai:**
- Tambahkan pemanggilan `octokit.rest.checks.listForRef()` atau `octokit.rest.repos.getCombinedStatusForRef()` untuk branch task terkait, ambil hasil check run terbaru (pass/fail/pending)
- Jika belum ada CI/test yang jalan di repo user, atau hasilnya `pending`, CSA harus menahan approval (status task tetap `awaiting_review`) dan beri pesan jelas ke user: "menunggu hasil CI sebelum bisa diverifikasi" — bukan langsung lanjut ke evaluasi AI
- Jika hasil CI `failure`, task otomatis `rejected` tanpa perlu evaluasi AI lebih lanjut (gagal CI = gagal, tidak perlu opini tambahan)
- Hasil CI (pass/fail, link ke run) dimasukkan ke `reportMarkdown` yang di-outbox, supaya audit trail-nya lengkap
- Keyword matching yang sudah ada boleh dipertahankan sebagai lapisan tambahan (bukan pengganti), tapi harus dijelaskan secara eksplisit di kode/komentar bahwa ini heuristik tambahan, bukan sumber kebenaran utama

---

## Koreksi 3 — Push `AGENTS.md` Sungguhan ke Repository User

**Masalah:** Isi `AGENTS.md` di `read-file/route.ts` adalah string hardcoded untuk simulasi file browser. Tidak ada fungsi yang benar-benar meng-commit `AGENTS.md` ke root repository user lewat GitHub API — bertentangan dengan Task 2.3 di ROADMAP yang mensyaratkan file ini otomatis muncul di repo user.

**Definisi Selesai:**
- Buat fungsi (bisa dipicu saat project baru dibuat, mirip pola `sync-task`) yang memanggil `octokit.rest.repos.createOrUpdateFileContents()` untuk menulis `AGENTS.md` ke root branch default repo user
- Isi `AGENTS.md` yang di-push harus sama dengan versi final yang sudah disepakati (rujuk ke file `AGENTS.md` yang sudah ada di `docs/` sebagai sumber, bukan string terpisah di `read-file/route.ts`)
- Setelah `AGENTS.md` berhasil di-push, `PROGRESS.md`/notifikasi UI baru boleh menyatakan "berhasil dibuat di repository" — hapus/perbaiki notifikasi yang sudah ada karena saat ini menampilkan klaim sukses tanpa aksi nyata di baliknya
- Uji dengan repo GitHub nyata: buat project baru di aplikasi, cek langsung di GitHub bahwa `AGENTS.md` benar muncul di root repo

---

## Koreksi 3.1 — Pisahkan Template `AGENTS.md` untuk Repo Target End-User

**Masalah:** Koreksi 3 sudah benar secara teknis (push file sungguhan via GitHub API), tapi isi file yang di-push adalah `AGENTS.md` milik aplikasi CSA sendiri (dipakai untuk memandu pembangunan CSA di repo `rekanvibecoding`) — file ini menyebut `docs/PRD.md`, `docs/ROADMAP.md`, `docs/PROGRESS.md` dengan task bernomor statis. Padahal mekanisme nyata yang dipakai CSA untuk berkomunikasi dengan AI Engineer di repo **project milik end-user** adalah folder `csa-sync/inbox` (task per-iterasi) dan `csa-sync/outbox` (laporan) — sama sekali tidak disebut di file yang di-push. Akibatnya AI Engineer di project end-user tidak akan tahu harus mengecek `csa-sync/inbox` untuk menemukan task barunya.

**Definisi Selesai:**
- Buat file template baru, misal `src/lib/templates/agents-target-repo.md` (atau konstanta string di kode), **terpisah** dari `AGENTS.md` milik root aplikasi CSA sendiri
- Isi template ini wajib eksplisit menyebut:
  - Sebelum kerja, wajib baca `csa-sync/context.md` untuk memahami state project terkini
  - Cek folder `csa-sync/inbox/` untuk file task terbaru yang perlu dikerjakan (format `task-{id}.md`)
  - Setelah selesai, tulis laporan ke `csa-sync/outbox/report-{id}.md` sesuai format yang sudah dibakukan (field: task_id, status, ringkasan perubahan, file yang diubah, catatan untuk CSA)
  - Jangan pernah menyentuh atau merge langsung ke branch main — itu wewenang CSA
  - Aturan dasar lain yang relevan (satu task per sesi, commit per task, jangan hapus fitur lama) tetap dipertahankan dari `AGENTS.md` versi lama, disesuaikan konteksnya
- Update `src/app/api/github/push-agents/route.ts` supaya membaca dari template baru ini, **bukan** dari `AGENTS.md` root aplikasi CSA
- `AGENTS.md` di root aplikasi CSA (`rekanvibecoding`) tetap dipertahankan apa adanya — itu khusus untuk memandu pembangunan CSA itu sendiri, tidak untuk di-push ke repo lain
- Uji: buat project baru yang terhubung ke repo test, verifikasi isi `AGENTS.md` yang muncul di repo tersebut memuat instruksi `csa-sync/inbox`/`csa-sync/outbox`, bukan instruksi `docs/ROADMAP.md`

---

## Koreksi 4 — Sinkronkan Dokumen Repo dengan Versi Terbaru

**Masalah:** `docs/ROADMAP.md` dan `docs/BRD.md` di repo belum memuat revisi terakhir (Fase 7.5 — mode self-hosted vs hosted & sistem token; section 3.1 BRD — model bisnis). AI Engineer bekerja dari rencana yang sudah kadaluarsa.

**Definisi Selesai:**
- Update `docs/ROADMAP.md` dan `docs/BRD.md` di repo dengan isi terbaru yang sudah mencakup Fase 7.5 dan section 3.1 (salin dari dokumen final terbaru)
- Setelah diupdate, tambahkan task-task Fase 7.5 (7.5.1 - 7.5.6) ke `PROGRESS.md` dengan status `belum dikerjakan`

---

## Koreksi 5 — Kembalikan Model Self-Hosted 100% Gratis & Tambah Link Donasi

**Masalah:** Saat mengerjakan Koreksi 4 (sinkronisasi dokumen), `docs/BRD.md` section 3.1 secara tidak sengaja diubah substansinya — menambahkan biaya langganan bulanan untuk mode self-hosted. Ini bertentangan dengan keputusan yang sudah disepakati sejak awal: **mode self-hosted harus 100% gratis** (user hanya menanggung biaya API key miliknya sendiri, tanpa biaya langganan apa pun ke pemilik produk). Perubahan substansi ini juga tidak dicatat sebagai catatan eksplisit untuk ditinjau manusia, padahal `AGENTS.md` mewajibkan itu.

**Definisi Selesai:**
- Revisi `docs/BRD.md` section 3.1: hapus kalimat yang menyebut biaya langganan bulanan untuk mode self-hosted. Tulis ulang jadi eksplisit: *"Mode Self-Hosted (Bring Your Own Key): pengguna memasukkan API key LLM miliknya sendiri, tidak dikenakan biaya apa pun ke pemilik produk (100% gratis untuk akses platform). Biaya yang timbul hanya dari pemakaian API key milik pengguna sendiri ke provider AI pilihannya."*
- Cek dan sesuaikan `docs/ROADMAP.md` Fase 7.5, khususnya task yang berkaitan dengan pemotongan saldo/token — pastikan skema pemotongan token/billing **hanya berlaku di mode Hosted**, dan mode Self-Hosted tidak pernah memicu pemotongan saldo atau permintaan pembayaran apa pun
- Tambahkan section baru di `README.md` (root repo) berisi ajakan donasi sukarela, dengan placeholder link yang nanti diisi manual oleh pemilik project, contoh:
  ```md
  ## Dukung Project Ini

  Rekanvibecoding open source dan mode self-hosted-nya 100% gratis untuk digunakan. Kalau project ini membantu kamu, kamu bisa mendukung pengembangannya lewat donasi sukarela:

  [Donasi lewat PayPal](PASTE_PAYPAL_LINK_DI_SINI)
  ```
- **Jangan** menebak atau mengarang link PayPal apa pun — biarkan placeholder `PASTE_PAYPAL_LINK_DI_SINI` apa adanya, karena link asli akan diisi manual oleh pemilik project di luar sesi AI ini
- Update `docs/PROGRESS.md`: catat eksplisit di catatan bahwa ini adalah **koreksi atas penyimpangan keputusan bisnis** yang terjadi di Koreksi 4, bukan sekadar update biasa

**Catatan khusus untuk AI Engineer:** Ini kesalahan yang sama jenisnya dengan sebelumnya (menganggap "sinkronisasi dokumen" sebagai kesempatan menulis ulang isi, bukan menyalin persis apa yang sudah disepakati). Untuk task dokumentasi ke depannya: **salin/pertahankan keputusan yang sudah eksplisit disepakati, jangan diinterpretasikan ulang** — kalau ada yang terasa perlu diubah substansinya, tulis sebagai pertanyaan/catatan untuk manusia dulu, jangan langsung diubah.

---

## Koreksi 6 — Aktifkan Integrasi Model Claude yang Masih Dipaksa Mock

**Masalah:** Di `src/lib/ai.ts`, ada logika `isClaude = model.startsWith('claude')` yang dipakai untuk memaksa `shouldMock` selalu `true` kapan pun model yang dipilih adalah Claude — terlepas dari apakah API key Anthropic tersedia atau tidak. Tidak ada package `@ai-sdk/anthropic` yang di-import sama sekali di codebase. Ini bertentangan dengan prinsip "model AI fleksibel, tidak terkunci ke satu provider" — saat ini hanya Gemini dan OpenAI yang benar-benar terhubung nyata, Claude selalu tampil sebagai opsi tapi diam-diam selalu berjalan dalam mode simulasi.

**Definisi Selesai:**
- Install package `@ai-sdk/anthropic` (via `npm install @ai-sdk/anthropic --save`)
- Di `src/lib/ai.ts`, tambahkan inisialisasi provider Anthropic (mengikuti pola yang sudah ada untuk Gemini/OpenAI), dan hapus logika `isClaude` yang memaksa mock
- `shouldMock` untuk model apa pun (termasuk Claude) hanya boleh `true` kalau API key yang relevan **memang tidak tersedia** di environment variable — bukan berdasarkan nama providernya
- Tambahkan `ANTHROPIC_API_KEY` ke `.env.example` (tanpa nilai asli)
- Pastikan UI pemilihan model (label "Hemat"/"Andal" dan semacamnya yang sudah dibuat sebelumnya) tetap konsisten menampilkan opsi Claude dengan benar, dan benar-benar memanggil API Anthropic saat dipilih dan API key tersedia
- Uji: set `ANTHROPIC_API_KEY` nyata di environment lokal, pilih model Claude di UI, jalankan satu aksi (misal brainstorming), verifikasi responsnya benar berasal dari panggilan API Anthropic sungguhan (bukan mock) — bisa dicek lewat log/network request, bukan cuma asumsi dari tampilan UI
- Update `docs/PROGRESS.md` dengan catatan eksplisit bahwa ini memperbaiki gap dari review sebelumnya (model Claude sebelumnya selalu ter-mock diam-diam)

---

## Catatan untuk Update `PROGRESS.md`

Setelah tiap koreksi di atas selesai, jangan hanya tandai "Selesai" — tuliskan juga secara eksplisit di kolom catatan bahwa ini **koreksi dari implementasi mock/simulasi sebelumnya**, dan sertakan bukti verifikasi nyata (misalnya: link commit AGENTS.md di repo, atau nomor PR yang benar ter-merge) supaya klaim "selesai" berikutnya bisa dipercaya tanpa perlu direview ulang dari nol.
