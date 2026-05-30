# 🏥 Sistem Rekam Medis Elektronik (RME) Praktek Dr. Sudiman

Sistem Rekam Medis Elektronik (RME) modern berbasis web yang dirancang khusus untuk mempermudah operasional pendaftaran, antrian pemeriksaan, rekam medis klinis, pencatatan transaksi obat, dan audit keamanan data (audit trail) pada Praktek Dokter Umum Dr. Sudiman.

---

## 🚀 Fitur Utama & Alur Kerja Sistem

### 1. Manajemen Multi-Role Akses & Proteksi Rute
Sistem mendeteksi peran pengguna secara otomatis di tingkat server dan memproteksi rute dari akses silang peran secara real-time:
*   **Staf Pendaftaran**: Mendaftarkan pasien baru, menginput vital sign dasar (tensi, suhu, nadi), dan memasukkan ke antrian dokter.
*   **Dokter**: Mengelola antrian periksa, menginput hasil pemeriksaan (anamnesis, fisik, diagnosis ICD-10, terapi), meresepkan obat dengan proteksi stok minus, dan merekam pembayaran.
*   **Administrator**: Mengelola master pengguna (staf & dokter), memantau stok dan log barang masuk obat, memantau *Attendance* (kehadiran harian & rekap bulanan), serta memantau *Activity Log (Audit Trail)* sistem.

### 2. Live Ticking Clock & UX Premium
*   Widget waktu bergerak dinamis (Live Clock) terintegrasi pada navigasi sidebar untuk semua role yang disesuaikan dengan zona waktu lokal (WIB).
*   Desain antarmuka eksklusif lembar fisik rekam medis (gaya kertas fisik ivory dengan kop Klaten dan tulisan tinta pena biru) untuk memberikan transisi mulus bagi dokter.
*   Penerapan dialog konfirmasi (*Alert Dialog*) sebelum penghapusan data dan visual responsif penuh pada resolusi desktop maupun mobile.

### 3. Monitoring Attendance & Activity Logs (Admin)
*   **Kehadiran Real-time**: Menampilkan tabel log harian (jam masuk, keluar, durasi kerja, jumlah pasien ditangani). Row disorot merah jika karyawan lupa/belum melakukan logout.
*   **Rekap Performa Bulanan**: Menampilkan total kehadiran, rata-rata jam kerja, dan kontribusi penanganan pasien dalam bentuk *Grid Card* per user.
*   **Audit Trail (Activity Log)**: Mencatat setiap penambahan, pembaruan, aktivasi/nonaktivasi entitas lengkap dengan detail perubahan data (format JSON terurai dan collapsible), pelaksana, dan alamat IP.
*   **Multi-Ekspor Data**: Mendukung ekspor data dalam format **CSV** dan cetak cetakan laporan **PDF** berdesain elegan lengkap dengan kop klinik resmi dan ringkasan kinerja.

### 4. Keamanan Data & Form Validation
*   Validasi forms terpusat menggunakan **Zod Schema** dengan umpan balik pesan kesalahan dalam Bahasa Indonesia yang informatif.
*   Proteksi level database menggunakan Supabase **Row Level Security (RLS) Policies** di seluruh tabel transaksi.

---

## 🛠️ Arsitektur & Teknologi Stack

*   **Framework**: [Next.js (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript (Strict Mode)](https://www.typescriptlang.org/)
*   **Database & Auth**: [Supabase (PostgreSQL)](https://supabase.com/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan Harmonious HSL Palettes
*   **Components**: Radix UI Primitives (Accessible components)
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
│   ├── actions/                # Server Actions terbagi per fungsionalitas
│   ├── error.tsx               # Error boundary global (Bahasa Indonesia)
│   └── not-found.tsx           # Halaman fallback 404
├── components/
│   ├── ui/                     # Komponen UI dasar reusable (shadcn)
│   └── dashboard/              # Kerangka dashboard & Sidebar dinamis
├── database/
│   ├── schema.sql              # Struktur tabel, indeks, RLS, & triggers
│   └── seed.sql                # Data dummy awal (akun, obat, ICD-10)
├── lib/
│   ├── validations.ts          # Zod schema terpusat
│   ├── activity-logger.ts      # Logger aktivitas audit trail
│   └── attendance.ts           # Tracker sign-in & sign-out otomatis
├── middleware.ts               # Next.js Middleware pengaman rute
└── package.json
```

---

## ⚙️ Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js (v18+)** dan memiliki akun **Supabase** aktif.

### 2. Kloning & Instalasi Dependensi
```bash
# Install paket dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env.local` atau isi berkas `.env` di root project Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> [!IMPORTANT]  
> `SUPABASE_SERVICE_ROLE_KEY` sangat diperlukan oleh admin server actions untuk mendaftarkan dan mengelola user baru di auth.users secara aman bypass RLS.

### 4. Setup Database & Seeding
Jalankan perintah SQL berikut di **Supabase SQL Editor**:
1.  Salin dan jalankan seluruh isi file `database/schema.sql` untuk membuat tabel, fungsi helper, mengaktifkan RLS, dan membuat relasi index.
2.  Salin dan jalankan isi file `database/seed.sql` untuk mengisi data obat dan diagnosis ICD-10, serta mendaftarkan kredensial akun default untuk pengujian.

### 5. Jalankan Local Dev Server
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🔑 Akun Uji Coba Default

Kredensial akun default yang siap digunakan (setelah melakukan database seeding):

| Peran (Role) | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@klinik.com` | `admin123` |
| **Dokter** | `dokter.budi@klinik.com` | `dokter123` |
| **Staf** | `staf.nisa@klinik.com` | `staf123` |

---

## 🛡️ Kebijakan Keamanan (Security Audit & RLS)
Seluruh tabel diaktifkan **Row Level Security (RLS)** dengan kebijakan akses ketat:
*   `activity_logs`: Hanya dapat dibaca oleh Admin. Input diizinkan otomatis saat user melakukan aksi di server.
*   `attendance_logs`: Hanya dapat dibaca oleh pemilik log tersebut atau Admin.
*   `obat`: Semua user terautentikasi dapat membaca stok. Modifikasi (tambah obat, ubah harga, mutasi stok) eksklusif untuk Admin.
*   `rekam_medis`: Dapat dibaca oleh staf/dokter. Modifikasi hanya diizinkan untuk Dokter yang terdaftar menangani pasien pada hari kunjungan terkait.
