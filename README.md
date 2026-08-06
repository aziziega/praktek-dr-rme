# 🏥 Sistem Rekam Medis Elektronik (RME) Praktek Dr. Sudiman

Sistem Rekam Medis Elektronik (RME) modern berbasis web yang dirancang khusus untuk mempermudah operasional pendaftaran, antrian pemeriksaan, rekam medis klinis, pencatatan transaksi obat, dan audit keamanan data pada tingkat *Enterprise* untuk Klinik / Praktek Dokter Umum.

---

## 🚀 Fitur Utama & Keunggulan Sistem

### 1. Kinerja Medis & UI/UX Eksekutif
*   **Kanvas Rekam Medis Interaktif:** Dokter dapat menggambar (mencoret) anamnesis, diagnosis, dan terapi pada kanvas khusus bergaya kertas *ivory* klasik. Rendering dioptimalkan di tingkat *frame-rate* (`requestAnimationFrame`) tanpa *lag*.
*   **Live Ticking Clock:** Widget waktu bergerak dinamis yang tersinkronisasi zona waktu (WIB) untuk semua role.
*   **Desain Responsif & Premium:** Dibangun dengan Tailwind CSS v4 dan komponen shadcn berpalet *Harmonious HSL*.

### 2. Transaksi Terpadu & Aman (Postgres RPC)
*   Sistem telah dirombak menggunakan **Remote Procedure Call (RPC)** tingkat *Database*. Proses penyelesaian kunjungan, pemotongan stok obat, penyimpanan rekam medis, pembuatan tagihan kasir, dan kalkulasi kehadiran dokter dieksekusi secara **Atomic** dalam 1 API *Request*. 
*   Mencegah isu *Race Condition* (stok obat ganda) dan menjamin konsistensi data finansial 100%.

### 3. Keamanan Tingkat Rumah Sakit (HIPAA / Permenkes Ready)
*   **Row Level Security (RLS) Ketat:** Akses ke setiap tabel (Rekam Medis, Pendapatan, Log, Obat) dikunci eksklusif berdasarkan *Role* user (Admin, Dokter, Staf).
*   **Private Storage Bucket & Signed URLs:** Berkas gambar rekam medis bersifat rahasia (Private Bucket). URL akses dibangkitkan sementara (*Signed URL*) secara dinamis melalui server yang tervalidasi auth, sehingga data rekam medis aman dari publik.
*   **Audit Trail (Activity Log):** Mencatat setiap aktivitas manipulasi data lengkap dengan format JSON historis, pelaksana, dan waktu. Sistem *Audit Log* bersifat *read-only* bahkan untuk Admin, mencegah pengelabuan rekam medis.

### 4. Manajemen Multi-Role & Laporan Keuangan
*   **Staf Pendaftaran**: Mendaftarkan pasien baru, vital sign, dan manajemen antrian.
*   **Dokter**: Mengelola antrian, rekam medis digital, dan e-resep otomatis.
*   **Administrator**: Mengelola master pengguna (staf & dokter), laporan keuangan (pendapatan bersih/kotor) dengan grafik, memantau *Attendance* (kehadiran & pasien yang ditangani), serta memantau *Activity Log*.

---

## 🛠️ Arsitektur & Teknologi Stack

*   **Framework**: [Next.js (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript (Strict Mode)](https://www.typescriptlang.org/)
*   **Database & Auth**: [Supabase (PostgreSQL)](https://supabase.com/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Components**: Radix UI Primitives (shadcn/ui)
*   **Validations**: Zod & React Hook Form
*   **State & Toast**: Sonner, Lucide Icons

---

## 📦 Struktur Folder Penting

```text
├── app/
│   ├── (auth)/login/           # Halaman login
│   ├── (dashboard)/dashboard/  # Rute utama dashboard (role-segmented)
│   │   ├── admin/              # Monitoring, manajemen user, obat, pasien
│   │   ├── dokter/             # Antrean periksa & pengisian rekam medis
│   │   └── staf/               # Pendaftaran pasien & check-in kunjungan
│   ├── api/handwriting/        # API Proxy untuk generate Signed URL Storage Private
│   └── actions/                # Server Actions terbagi per fungsionalitas
├── components/
│   ├── ui/                     # Komponen UI dasar reusable (shadcn)
│   └── dokter/                 # Komponen Kanvas Medis (HandwritingCanvas) dll.
├── database/
│   ├── schema.sql              # Struktur tabel, indeks, RLS, & triggers
│   ├── seed.sql                # Data dummy awal (akun, obat, ICD-10)
│   └── selesaikan_kunjungan_rpc.sql # Fungsi Transaksional Atomic
├── docs/                       # Dokumentasi arsitektur, estimasi storage & checklist 
└── lib/
    ├── validations.ts          # Zod schema terpusat
    └── activity-logger.ts      # Logger aktivitas audit trail
```

---

## ⚙️ Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js (v18+)** dan memiliki akun **Supabase** aktif.

### 2. Kloning & Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env.local` di *root* project Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> [!IMPORTANT]  
> `SUPABASE_SERVICE_ROLE_KEY` sangat diperlukan untuk *generate signed URLs* pada bucket privat dan admin server actions (*bypass RLS auth*).

### 4. Setup Database & Seeding
Jalankan perintah SQL berikut di **Supabase SQL Editor**:
1. Jalankan isi file `database/schema.sql` (struktur tabel & RLS).
2. Jalankan isi file `database/seed.sql` (dummy data & akun).
3. Jalankan isi file `selesaikan_kunjungan_rpc.sql` (untuk fungsi atomic transaksi).

*Pastikan Anda juga telah membuat Storage Bucket bernama `handwriting-notes` dengan status **Private** di panel Storage Supabase.*

### 5. Jalankan Local Dev Server
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Kebijakan Keamanan (Security Audit & RLS)
Seluruh tabel telah diaktifkan **Row Level Security (RLS)** dengan kebijakan akses level produksi:
*   `activity_logs`: *Read-only* terbatas untuk Admin.
*   `attendance_logs`: Privat untuk pemilik log atau Admin.
*   `obat`: *Read-only* publik, *Write* eksklusif Admin.
*   `rekam_medis` & `kunjungan`: Diproteksi menggunakan validasi autentikasi ketat. Hak memodifikasi hanya untuk Dokter spesifik yang menangani kunjungan tersebut.
*   Gambar Rekam Medis dijaga kerahasiaannya dengan **Bucket Private** dan di-akses melalui *API Proxy Signed URL* yang kadaluarsa dalam 1 jam.
