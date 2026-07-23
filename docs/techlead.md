Jika saya berperan sebagai Tech Lead dan Anda adalah Owner/Product Visionary, maka tujuan pertama saya bukan langsung membuat kode atau memilih teknologi. Tujuan saya adalah memastikan bahwa saya memahami visi Anda dengan benar. Banyak proyek gagal bukan karena teknologinya buruk, tetapi karena tim membangun produk yang berbeda dari yang dibayangkan oleh owner.

Saya biasanya akan membagi prosesnya menjadi beberapa fase.

Fase 1 — Memahami Visi (The Why)

Pertanyaan pertama saya bukan:

"Mau pakai React atau Laravel?"

Tetapi:

"Kenapa aplikasi ini harus ada?"

Saya ingin memahami:

Masalah apa yang ingin diselesaikan?
Siapa pengguna utamanya?
Apa yang membuat aplikasi ini berbeda?
Jika aplikasi ini sukses 5 tahun lagi, seperti apa bentuknya?

Pada tahap ini saya lebih banyak mendengar daripada berbicara.

Fase 2 — Menggali Ide Owner

Saya akan melakukan interview yang cukup panjang.

Contohnya.

Tentang bisnis
Apa nama produk?
Kenapa memilih nama itu?
Apa tujuan bisnisnya?
Bagaimana aplikasi menghasilkan uang?
Siapa kompetitornya?
Apa kelebihan dibanding kompetitor?
Tentang user

Saya ingin membuat User Persona.

Misalnya.

User A

umur
pekerjaan
kebutuhan
masalah

User B

kebutuhan berbeda

dst.

Tentang alur penggunaan

Saya akan meminta owner bercerita seperti sedang menggunakan aplikasi.

Contoh.

"Bayangkan saya pertama kali membuka aplikasi."

Lalu saya bertanya.

Apa yang saya lihat?

Setelah itu?

Klik apa?

Masuk ke halaman mana?

Jika gagal?

Jika berhasil?

Saya akan menggambar flowchart dari cerita tersebut.

Fase 3 — Menentukan Scope

Ini yang paling penting.

Saya akan bertanya.

Mana yang benar-benar wajib ada?

Mana yang bisa ditunda?

Saya akan membaginya menjadi.

Must Have

Contoh

Login
Dashboard
CRUD Data
Should Have
Notification
Search
Export
Nice To Have
AI
Analytics
Dark Mode

Dengan begitu kita tahu apa yang masuk MVP.

Fase 4 — Mengubah Ide Menjadi Requirement

Biasanya owner berkata.

"Saya ingin dashboard yang keren."

Itu belum bisa dikerjakan developer.

Saya harus mengubahnya menjadi requirement.

Misalnya.

Dashboard memiliki

Statistik
Grafik
Recent Activity
Shortcut Menu

Sekarang requirement sudah jelas.

Fase 5 — Menulis PRD

Saya tidak akan mengandalkan ingatan.

Semua saya dokumentasikan.

Biasanya isi PRD seperti ini.

Vision

Background

Problem

Goals

Target User

Feature List

Business Rules

Success Metrics

Out of Scope

Roadmap

PRD menjadi pegangan semua orang.

Fase 6 — Membuat User Story

Saya mengubah requirement menjadi bahasa developer.

Contoh.

Sebagai user

Saya ingin login menggunakan Google

Agar saya tidak perlu membuat password.

Acceptance Criteria

tombol login muncul
berhasil redirect
data user tersimpan
Fase 7 — Membuat Flow

Saya menggambar.

User Flow
Navigation
Wireframe
Database Flow
API Flow

Kalau flow masih berubah setiap hari, saya belum akan menyuruh developer membuat fitur tersebut.

Fase 8 — Validasi

Saya akan menjelaskan kembali ide owner menggunakan bahasa saya sendiri.

Misalnya.

"Jadi yang saya pahami adalah..."

Lalu saya jelaskan seluruh sistem.

Owner tinggal menjawab.

benar
kurang tepat
revisi

Saya mengulang sampai owner berkata.

"Ya, itu memang yang saya bayangkan."

Tahap ini sangat penting karena mencegah salah paham sebelum pengembangan dimulai.

Fase 9 — Memecah Menjadi Task

Barulah saya membuat backlog.

Epic

↓

Feature

↓

Task

↓

Subtask

Misalnya.

Authentication

- Login
- Register
- Forgot Password

Invitation

- Create
- Edit
- Delete
- Publish

Theme

- Marketplace
- Preview
- Purchase
Fase 10 — Menentukan Arsitektur

Baru sekarang saya memilih teknologi.

Karena teknologi harus mengikuti kebutuhan produk, bukan sebaliknya.

Saya menentukan:

Frontend
Backend
Database
Storage
Authentication
Deployment
Monitoring
CI/CD
Jika Owner Sangat Visioner

Sering kali owner memiliki banyak ide besar, tetapi belum terstruktur. Dalam kondisi seperti itu, saya tidak akan meminta semuanya langsung menjadi spesifikasi teknis. Saya akan membantu mengubah ide tersebut menjadi artefak yang bisa dikerjakan secara bertahap.

Urutannya biasanya seperti ini:

Ide Acak
        │
        ▼
Vision
        │
        ▼
Problem Statement
        │
        ▼
Requirement
        │
        ▼
User Flow
        │
        ▼
PRD
        │
        ▼
Architecture
        │
        ▼
Task
        │
        ▼
Development

Dengan pendekatan ini, owner tetap bebas menuangkan ide sebanyak mungkin, sementara tim pengembang mendapatkan spesifikasi yang jelas dan dapat dieksekusi.

Jika saya menjadi Tech Lead Anda

Berdasarkan percakapan kita sebelumnya, saya akan mengambil peran sebagai penerjemah visi menjadi sistem. Anda fokus pada:

visi produk,
kebutuhan pengguna,
model bisnis,
dan keputusan prioritas.

Sementara saya bertanggung jawab untuk:

mengajukan pertanyaan yang tepat agar kebutuhan menjadi jelas,
mendokumentasikan keputusan dalam bentuk PRD, flow, dan spesifikasi teknis,
memecah pekerjaan menjadi backlog yang terstruktur,
menjaga konsistensi arsitektur,
serta memastikan setiap fitur yang dibangun tetap selaras dengan visi produk.

Dengan pembagian peran seperti ini, proses diskusi menjadi jauh lebih efektif karena setiap ide baru langsung diterjemahkan menjadi keputusan yang bisa ditindaklanjuti oleh tim pengembang.