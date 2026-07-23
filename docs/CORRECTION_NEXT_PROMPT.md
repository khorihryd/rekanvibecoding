# Prompt Siap Pakai — Jalankan Task Koreksi

Salin isi di bawah ini ke Cursor/Codex/Claude Code (atau tool lain) di dalam repository `rekanvibecoding`.

---

Baca file `AGENTS.md` di root repo ini dan `docs/CORRECTION_TASKS.md`.

Konteks: hasil review menemukan bahwa `docs/PROGRESS.md` mengklaim semua fase 100% selesai, tapi setelah dicek langsung ke kode, ditemukan beberapa bagian krusial ternyata hanya simulasi/mock, bukan implementasi nyata (lihat detail di `docs/CORRECTION_TASKS.md`).

Kerjakan Koreksi 1 sampai 4 di `docs/CORRECTION_TASKS.md` secara berurutan, satu koreksi per sesi:

1. Sebelum mulai tiap koreksi, baca ulang bagian "Masalah" dan "Definisi Selesai" dengan teliti — jangan menandai selesai kalau definisi selesainya belum benar-benar terpenuhi secara nyata (bukan mock).
2. Kalau untuk menguji koreksi ini butuh token/kredensial GitHub nyata yang belum tersedia di environment, berhenti dan laporkan eksplisit apa yang dibutuhkan dari saya (user) sebelum melanjutkan — jangan diam-diam tetap menandai selesai dalam mode mock.
3. Setelah satu koreksi benar-benar selesai dan teruji nyata, update `docs/PROGRESS.md` sesuai format di `AGENTS.md`, sertakan bukti verifikasi (link commit, nomor PR, atau hasil test nyata).
4. Tampilkan ringkasan ke saya setelah tiap koreksi selesai, sebelum lanjut ke koreksi berikutnya.
