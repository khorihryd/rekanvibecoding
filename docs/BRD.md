# Business Requirements Document (BRD)
## CSA — Chief Software Architect App

**Versi dokumen:** 1.0
**Status:** Draft awal untuk eksekusi MVP

---

## 1. Latar Belakang Bisnis

Semakin banyak individu non-teknis membangun produk software lewat AI ("vibe coding"), tapi mayoritas hasilnya tidak siap dipublikasikan karena tidak ada pengawasan kualitas yang konsisten. Ini menciptakan peluang bisnis: alat yang berperan sebagai "CTO/tech lead AI" bagi solo builder, memberi rasa aman dan hasil yang benar-benar production-ready.

## 2. Tujuan Bisnis

- Memvalidasi permintaan pasar untuk alat pengawasan kualitas berbasis AI khusus vibe coder
- Membangun MVP yang bisa dipakai end-to-end untuk minimal satu project nyata sebagai bukti konsep
- Meletakkan fondasi untuk model bisnis berlangganan (freemium → subscription) di fase berikutnya

## 3. Ruang Lingkup Bisnis

### Termasuk dalam scope MVP:
- Satu aplikasi web (SaaS) yang menjalankan peran CSA
- Dukungan untuk satu project per user
- Integrasi dengan repository GitHub milik user
- Model AI fleksibel (tidak terkunci ke satu provider)

### Di luar scope MVP:
- Dukungan multi-project atau tim (multi-user dalam satu project)
- Integrasi native dengan tool AI tertentu (Cursor API, Codex API, dll) — pendekatan awal tetap file-based/generic

### 3.1 Model Bisnis & Sistem Monetisasi (Revisi Fase 7.5)

Untuk mendukung keberlanjutan produk, aplikasi CSA menerapkan dual-mode pengoperasian:
1. **Mode Hosted (SaaS):** Pengguna menggunakan API key LLM & infrastruktur server yang disediakan oleh CSA. Penggunaan ini dikenakan biaya berbasis **Sistem Token** (kredit pemakaian) yang dikurangi setiap kali melakukan brainstorming, dekomposisi task, atau audit kode otomatis.
2. **Mode Self-Hosted (Bring Your Own Key):** Pengguna dapat memasukkan API Key LLM mereka sendiri (OpenAI, Google Gemini, dll) pada pengaturan proyek. Pada mode ini, pemakaian token di-bypass (gratis untuk akses server CSA), dan pengguna membayar biaya langganan bulanan (*subscription*) dasar yang lebih murah untuk penggunaan platform saja.

## 4. Pemangku Kepentingan (Stakeholders)

| Pihak | Kepentingan |
|---|---|
| Pemilik produk (kamu) | Validasi ide, MVP yang benar-benar bisa dipakai untuk membangun produk lain |
| User target (vibe coder non-teknis) | Alat yang mengurangi risiko produk gagal/rapuh saat publikasi |
| AI Engineer (tool pihak ketiga) | Bukan stakeholder langsung, tapi sistem harus tetap kompatibel dengan berbagai tool tanpa integrasi khusus |

## 5. Asumsi

- User memiliki akun GitHub dan bersedia menghubungkan repository ke aplikasi
- User memiliki akses ke minimal satu AI coding agent (Cursor, Codex, Claude Code, atau lainnya)
- User bersedia melakukan audit visual manual dan setup environment/secrets — sistem tidak mengasumsikan otomatisasi penuh dari sisi ini
- Model AI yang dipakai CSA dan AE bisa berbeda, dan bisa diganti sewaktu-waktu oleh user

## 6. Batasan (Constraints)

- MVP dibangun oleh satu orang non-teknis lewat vibe coding — kompleksitas fitur harus disesuaikan agar tetap bisa dieksekusi bertahap oleh AI Engineer
- Tidak ada anggaran untuk membangun runtime orkestrasi custom di fase ini — mengandalkan infrastruktur yang sudah ada (GitHub, Supabase, Vercel)
- Tidak semua AI coding tool mendukung mode background/otomatis penuh — sistem harus tetap berfungsi di mode manual sebagai baseline

## 7. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| CSA "ditipu" oleh laporan palsu AE | Kode rusak lolos ke main | Verifikasi selalu berbasis GitHub Actions/kode aktual, bukan klaim teks |
| AE ganti di tengah jalan kehilangan konteks | Progress mundur, kode tidak konsisten | Task self-contained + `context.md` + deteksi anomali otomatis |
| CSA sendiri kehilangan konteks antar sesi | Keputusan bertentangan, requirement diabaikan | State selalu di-reload dari database, bukan dari riwayat chat |
| Scope MVP terlalu besar untuk builder solo | Proyek tidak pernah selesai | Batasi ke single-project, tunda multi-project & integrasi tool khusus |
| User kewalahan dengan tugas audit manual | User berhenti pakai produk | Checklist audit spesifik per task, bukan instruksi generik |

## 8. Kriteria Sukses Bisnis (MVP)

- Aplikasi berhasil digunakan untuk membangun ulang project nyata (dogfooding) sampai minimal satu fitur penuh ter-merge ke main lewat alur CSA
- Alur kerja end-to-end (brainstorming → task → verifikasi → audit → merge) berjalan tanpa intervensi manual di luar yang didesain
- Ditemukan minimal satu kasus nyata di mana CSA berhasil mencegah kode bermasalah masuk ke main (bukti value proposition)

## 9. Riwayat Perubahan Dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | Draft awal | Versi pertama hasil brainstorming |
