# AGENTS.md

Instruksi ini wajib dibaca oleh AI coding agent (Cursor, Codex, Claude Code, atau tool lain apa pun) sebelum menyentuh kode di repository ini.

## Dokumen Sumber Kebenaran

Sebelum mengerjakan apa pun, baca dokumen berikut secara berurutan:

1. `csa-sync/context.md` — ringkasan arsitektur, parameter keamanan, dan status proyek terkini.
2. `csa-sync/inbox/` — cari berkas task spesifikasi terbaru yang perlu dikerjakan, berformat `task-{id}.md`.

## Aturan Wajib

1. **Kerjakan HANYA SATU task dari folder `csa-sync/inbox/` per sesi**, sesuai task yang ditugaskan (jangan melompati task atau mengerjakan beberapa task sekaligus).
2. **Jangan pernah meng-commit atau menggabungkan (merge) perubahan langsung ke branch main**. Selalu gunakan branch fitur berformat `feature/task-{id}`. Penggabungan kode ke branch default adalah wewenang penuh dari CSA (Chief Software Architect).
3. **Sebelum mulai kerja**, pastikan Anda berada di branch fitur yang tepat dan tarik (pull) perubahan terbaru dari repository default branch.
4. **Setelah task selesai**, tulis laporan audit/penyelesaian ke berkas baru di folder `csa-sync/outbox/report-{id}.md` dengan format berikut:
   ```markdown
   # Laporan Penyelesaian Task {id}
   - **Task ID:** {id}
   - **Status:** Selesai / Terhambat
   - **Ringkasan Perubahan:** {1-3 kalimat penjelasan ringkas}
   - **File yang Diubah:** {daftar file yang dimodifikasi}
   - **Catatan untuk CSA:** {catatan arsitektur atau parameter jika ada}
   ```
5. **Jangan mengubah atau menghapus fitur yang sudah ada** kecuali spesifikasi tugas di `task-{id}.md` secara eksplisit meminta perubahan tersebut.
6. **Commit di akhir setiap task** dengan pesan commit yang jelas menyebutkan ID task (misalnya `feat: task-{id} - integrasi sentry`). Jangan menumpuk beberapa task dalam satu commit besar.
7. **Keamanan Kredensial:** Jangan pernah menulis kredensial, API key, atau token sensitif secara langsung di dalam kode. Selalu gunakan environment variable dan tambahkan ke `.env.example` tanpa nilai asli.
8. **Penanganan Error:** Selalu bungkus kode logika baru/modifikasi dengan blok penanganan kesalahan (try/catch) dan integrasikan pelaporan error ke Sentry/sistem monitoring jika relevan.

## Jika Terjadi Kendala / Ragu

Jika instruksi tugas di `task-{id}.md` terasa ambigu atau bertentangan dengan arsitektur yang sudah ada di `csa-sync/context.md`, **hentikan pekerjaan** dan tulis pertanyaan eksplisit di berkas laporan `csa-sync/outbox/report-{id}.md` pada bagian "Catatan untuk CSA" agar ditinjau oleh CSA dan pemilik proyek sebelum dilanjutkan.
