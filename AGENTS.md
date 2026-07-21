# AGENTS.md

Instruksi ini wajib dibaca oleh AI coding agent (Cursor, Codex, Claude Code, atau tool lain apa pun) sebelum menyentuh kode di repository ini.

## Dokumen Sumber Kebenaran

Sebelum mengerjakan apa pun, baca urutan berikut:

1. `docs/PRD.md` — requirement produk, fitur, dan alur pengguna
2. `docs/BRD.md` — tujuan bisnis, batasan, dan risiko
3. `docs/ROADMAP.md` — daftar task berurutan per fase, lengkap dengan "Definisi Selesai"
4. `docs/PROGRESS.md` — checklist task mana yang sudah selesai (jika belum ada, buat saat pertama kali menjalankan instruksi ini)

## Aturan Wajib

1. **Kerjakan HANYA SATU task dari `ROADMAP.md` per sesi**, sesuai urutan nomor (jangan lompat fase atau task, kecuali `PROGRESS.md` menunjukkan task sebelumnya sudah selesai).
2. **Sebelum mulai kerja**, cek `PROGRESS.md` untuk tahu task terakhir yang selesai. Jika file ini belum ada atau kosong, review kode yang sudah ada di repo untuk menyimpulkan sejauh mana progress saat ini dibanding `ROADMAP.md`, lalu catat kesimpulan itu di `PROGRESS.md` sebelum lanjut.
3. **Jangan mengerjakan task yang "Definisi Selesai"-nya tidak bisa kamu penuhi** dalam satu sesi wajar. Kalau ternyata task terlalu besar, berhenti, jangan dipaksakan, dan laporkan di `PROGRESS.md` bahwa task ini perlu dipecah lebih kecil.
4. **Setelah task selesai**, update `PROGRESS.md`: tandai task tersebut selesai, tulis ringkasan singkat apa yang dikerjakan dan file apa saja yang berubah.
5. **Ikuti stack dan konvensi yang sudah ditentukan di PRD/ROADMAP** (Next.js, Supabase, Vercel AI SDK, Octokit, dll) — jangan mengganti pilihan teknologi sendiri tanpa mencatatnya sebagai catatan eksplisit di `PROGRESS.md` untuk ditinjau manusia.
6. **Jangan mengubah atau menghapus fitur yang sudah ditandai selesai** di `PROGRESS.md` kecuali task yang sedang dikerjakan memang secara eksplisit meminta perubahan itu.
7. **Commit di akhir setiap task selesai** dengan pesan commit yang menyebut nomor task (misal `feat: task 1.2 - tabel projects`), jangan menumpuk beberapa task dalam satu commit besar.
8. **Jangan menulis kredensial/API key langsung di kode.** Selalu environment variable, dan tambahkan ke `.env.example` (tanpa nilai asli) kalau ada variable baru.

## Kalau Ragu

Kalau instruksi task di `ROADMAP.md` terasa ambigu atau bertentangan dengan kode yang sudah ada, **berhenti dan tulis pertanyaan eksplisit** di `PROGRESS.md` di bagian task terkait, alih-alih menebak dan melanjutkan. Manusia (pemilik project) akan menjawab sebelum sesi berikutnya.

## Format Update `PROGRESS.md`

Gunakan format berikut untuk tiap task yang selesai dikerjakan:

```md
## Task {nomor} — {judul task}
Status: Selesai
Tanggal: {tanggal}
Ringkasan: {1-3 kalimat apa yang dikerjakan}
File berubah: {daftar file}
Catatan untuk manusia: {jika ada hal yang perlu ditinjau/diputuskan}
```
