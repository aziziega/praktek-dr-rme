# 🤖 Antigravity Prompts — RME Praktek Dr. Umum Sudiman
> Jalankan secara berurutan. Setiap sesi selesai → test dulu → baru lanjut sesi berikutnya.
> Model: claude-opus-4-6

---

## Cara Pakai
1. Buka Antigravity, arahkan ke root folder project
2. Copy prompt sesi yang ingin dijalankan
3. Paste ke Antigravity, jalankan
4. Review hasil, test di browser
5. Lanjut ke sesi berikutnya

---

## SESI 1 — Foundation: Auth, Middleware, Layout & Role System

```
Kamu adalah senior fullstack developer. Saya membangun sistem Rekam Medis Elektronik (RME) untuk Praktek Dr. Umum Sudiman menggunakan Next.js 16 App Router, Tailwind CSS, shadcn/ui, dan Supabase (PostgreSQL).

Project sudah di-init. Supabase sudah terinstall. .env sudah ada NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY .

Kerjakan:

1. lib/supabase/client.ts dan lib/supabase/server.ts untuk Supabase browser & SSR client

2. middleware.ts:
   - Proteksi semua route /dashboard
   - Redirect ke /login jika tidak authenticated
   - Redirect setelah login sesuai role: staf→/dashboard/staf/pendaftaran, dokter→/dashboard/dokter/antrian, admin→/dashboard/admin/users

3. app/(auth)/login/page.tsx:
   - Form email + password dengan shadcn Card, Input, Button
   - Tampilkan error jika gagal
   - Redirect sesuai role setelah sukses

4. app/(dashboard)/layout.tsx:
   - Sidebar berbeda per role:
     staf: Pendaftaran, Antrian Hari Ini
     dokter: Antrian Saya
     admin: Manajemen User, Manajemen Pasien, Stok Obat, Attendance, Activity Log
   - Tampilkan nama user & role di sidebar, tombol Logout
   - Mobile responsive

5. lib/attendance.ts:
   - initAttendanceTracking() via supabase.auth.onAuthStateChange
   - SIGNED_IN: insert attendance_logs jika belum ada record hari ini (jam_masuk = now())
   - SIGNED_OUT: update jam_keluar = now()

6. lib/activity-logger.ts:
   - logActivity({ userId, aksi, targetTabel, targetId, detail }) → insert activity_logs

7. types/database.ts — TypeScript types semua tabel:
   users, pasien, kunjungan, rekam_medis, obat, resep_obat, pembayaran, attendance_logs, activity_logs

Schema:
users: id uuid, email text, nama text, role (staf|dokter|admin), aktif bool, created_at
attendance_logs: id uuid, user_id uuid, tanggal date, jam_masuk timestamptz, jam_keluar timestamptz, durasi_menit int, jumlah_pasien_ditangani int, ip_address text, created_at
activity_logs: id uuid, user_id uuid, aksi text, target_tabel text, target_id uuid, detail jsonb, ip_address text, created_at
pasien: id uuid, nrm text unique, nama text, tanggal_lahir date, tempat_lahir text, jenis_kelamin (L|P), alamat text, no_hp text, alergi_obat text, created_at, updated_at
kunjungan: id uuid, pasien_id uuid, dokter_id uuid, staf_id uuid, tanggal date, jam_daftar timestamptz, jam_selesai timestamptz, tensi_sistolik int, tensi_diastolik int, nadi int, suhu numeric, keluhan_utama text, status (menunggu|diperiksa|selesai), created_at
rekam_medis: id uuid, kunjungan_id uuid unique, dokter_id uuid, anamnesis text, pemeriksaan_fisik text, diagnosis_kode text, diagnosis_nama text, terapi text, catatan text, created_at, updated_at
obat: id uuid, nama text, satuan text, stok int, harga_jual numeric, aktif bool, created_at, updated_at
resep_obat: id uuid, kunjungan_id uuid, obat_id uuid, nama_obat text, dosis text, jumlah int, harga_satuan numeric, subtotal numeric, created_at
pembayaran: id uuid, kunjungan_id uuid unique, dokter_id uuid, tarif_periksa numeric, total_obat numeric, total_bayar numeric, metode_bayar text, status (lunas|belum_lunas), catatan text, created_at

UI bersih, profesional, mudah dipakai staf non-teknis. TypeScript strict.
```

---

## SESI 2 — Fitur Staf: Pendaftaran Pasien & Antrian

```
Lanjutkan project RME Praktek Dr. Umum Sudiman. Foundation sudah selesai (auth, middleware, layout, supabase client, types, activity-logger, attendance).

Kerjakan halaman untuk role STAF:

1. app/(dashboard)/staf/pendaftaran/page.tsx — halaman utama staf

Alur:
a. Search bar prominent: cari pasien by NRM, nama, atau tanggal lahir
   - Realtime search saat ketik (debounce 300ms)
   - Hasil sebagai kartu: nama, NRM, tgl lahir, alergi obat

b. Pasien ditemukan → klik → lanjut form kunjungan
c. Tidak ditemukan → "Daftarkan Pasien Baru" → form:
   - nama*, tgl lahir*, tempat lahir, jenis kelamin*, alamat*, no HP, alergi obat
   - NRM auto-generate format "RME-XXXX" increment dari terakhir
   - Setelah simpan → otomatis lanjut form kunjungan

d. Form Kunjungan:
   - Info pasien di atas (nama, NRM, alergi obat — highlight merah jika ada alergi)
   - Vital sign: Tensi Sistolik, Tensi Diastolik, Nadi, Suhu
   - Textarea: Keluhan Utama
   - Dropdown: Assign ke Dokter (from users where role=dokter and aktif=true)
   - Submit → insert kunjungan status menunggu
   - Setelah submit: toast sukses, reset form, fokus kembali ke search bar

e. Panggil logActivity() setiap aksi penting

2. app/(dashboard)/staf/antrian/page.tsx

- Tabel antrian hari ini: No urut, Nama, NRM, Dokter, Waktu Daftar, Status
- Badge warna: menunggu (kuning), diperiksa (biru), selesai (hijau)
- Auto-refresh via Supabase Realtime
- Filter by dokter
- Counter: total, menunggu, diperiksa, selesai

Gunakan shadcn/ui. Server components untuk initial load, client untuk interaktivitas.
TypeScript strict. Loading skeleton saat fetch.
```

---

## SESI 3 — Fitur Dokter: Antrian & Form Rekam Medis

```
Lanjutkan project RME Praktek Dr. Umum Sudiman. Foundation + fitur staf sudah selesai.

Kerjakan halaman untuk role DOKTER:

1. app/(dashboard)/dokter/antrian/page.tsx
- List pasien hari ini yang di-assign ke dokter yang login
- Kartu per pasien: nama, NRM, waktu daftar, vital sign, keluhan, status
- Highlight alergi obat (border merah)
- Realtime notif toast saat pasien baru di-assign (Supabase Realtime INSERT filter dokter_id = current user)
- Tombol "Periksa" → update status ke diperiksa → navigate ke halaman periksa
- Pasien selesai tampil opacity rendah

2. app/(dashboard)/dokter/periksa/[kunjunganId]/page.tsx
Layout 2 kolom:
- Kiri (1/3): Info pasien + riwayat 5 kunjungan terakhir (accordion)
  nama, NRM, usia, jenis kelamin, alergi (highlight merah), vital sign kunjungan ini
- Kanan (2/3): 3 tab

TAB 1 — Rekam Medis:
- Textarea: Anamnesis, Pemeriksaan Fisik
- Search ICD-10 (query tabel icd10 by keyword/kode) → dropdown hasil
- Textarea: Terapi, Catatan
- Auto-save draft tiap 30 detik

TAB 2 — Resep & Obat:
- Search obat dari master (aktif=true), tampil nama/satuan/stok/harga
- Warning stok < 5
- Form row: dosis, jumlah, harga satuan (auto-fill, bisa edit)
- Bisa input obat manual jika tidak ada di master
- Tabel resep dengan tombol hapus per baris
- Total harga otomatis

TAB 3 — Pembayaran:
- Input: Tarif Periksa (bisa diubah)
- Display: Total Obat (read-only dari tab 2)
- Display: TOTAL BAYAR (prominent)
- Textarea: Catatan
- Tombol "Selesai & Tandai Lunas":
  * Insert pembayaran
  * Kurangi stok obat
  * Update status kunjungan → selesai + jam_selesai
  * Update jumlah_pasien_ditangani di attendance_logs hari ini
  * logActivity untuk SIMPAN_REKAM_MEDIS dan CATAT_BAYAR
  * Redirect ke /dashboard/dokter/antrian

Semua mutasi via Server Actions. TypeScript strict.
Cek akses: dokter hanya bisa akses kunjungan miliknya sendiri.
Jika kunjungan sudah selesai, form jadi read-only.
```

---

## SESI 4 — Admin: Manajemen User, Stok Obat & Pasien

```
Lanjutkan project RME Praktek Dr. Umum Sudiman. Foundation + fitur staf + fitur dokter sudah selesai.

Kerjakan halaman untuk role ADMIN:

1. app/(dashboard)/admin/users/page.tsx — Manajemen User
- Tabel: nama, email, role (badge), status aktif, tanggal dibuat, aksi
- Filter by role
- Tombol "Tambah User Baru" → Dialog:
  nama*, email*, role* (staf/dokter/admin)
  → createUser di Supabase Auth via service role key (server action) + insert tabel users
  → logActivity TAMBAH_USER
- Aksi per baris: Edit (nama, role), Nonaktifkan/Aktifkan toggle
- logActivity EDIT_USER / NONAKTIF_USER / AKTIF_USER
- Tidak ada hapus permanen

2. app/(dashboard)/admin/obat/page.tsx — Stok Obat
- Tabel: nama, satuan, stok, harga jual, status, aksi
- Badge merah "Stok Menipis" jika stok ≤ 10
- Filter: semua/aktif/nonaktif/menipis, search nama
- Tambah/Edit obat via Dialog: nama*, satuan*, stok*, harga*
- Tombol "+ Stok" → Dialog input jumlah tambahan
- logActivity TAMBAH_OBAT / EDIT_OBAT / TAMBAH_STOK / NONAKTIF_OBAT
- Nonaktifkan bukan hapus

3. app/(dashboard)/admin/pasien/page.tsx — Manajemen Pasien
- Tabel: NRM, nama, tgl lahir, no HP, tanggal daftar
- Search by NRM atau nama
- Klik baris → drawer/sheet detail + riwayat kunjungan lengkap (read-only)
- Edit data pasien + logActivity EDIT_PASIEN
- "Input Pasien Lama": form dengan NRM bisa diisi manual (migrasi data lama)

Konfirmasi dialog sebelum nonaktifkan.
Gunakan SUPABASE_SERVICE_ROLE_KEY untuk operasi admin auth.
TypeScript strict. Server Actions untuk semua mutasi.
```

---

## SESI 5 — Admin: Attendance Logs & Activity Log

```
Lanjutkan project RME Praktek Dr. Umum Sudiman. Semua fitur utama sudah selesai.

Kerjakan halaman monitoring untuk ADMIN:

1. app/(dashboard)/admin/attendance/page.tsx

Filter: date range picker (default bulan ini), filter by user, filter by role

Section A — Tabel Detail Harian:
- Kolom: Tanggal, Nama, Role, Jam Masuk, Jam Keluar, Durasi (X jam Y menit), Jumlah Pasien Ditangani
- Durasi dihitung dari jam_masuk ke jam_keluar
- Row highlight merah jika jam_keluar NULL (belum logout)
- Urutkan terbaru di atas

Section B — Rekap Bulanan (grid kartu per user):
- Nama, Role, Total hari hadir, Rata-rata jam kerja, Total pasien ditangani

Tombol "Export CSV" untuk data yang difilter

2. app/(dashboard)/admin/activity/page.tsx

Filter: date range (default 7 hari), filter by user, filter by aksi (multi-select)

Tabel:
- Kolom: Waktu, User, Role, Aksi (badge warna), Target, Detail (expandable)
- Badge warna:
  hijau: TAMBAH_PASIEN, TAMBAH_USER, TAMBAH_OBAT, TAMBAH_STOK
  kuning: EDIT_PASIEN, EDIT_USER, EDIT_OBAT, SIMPAN_REKAM_MEDIS
  merah: HAPUS_PASIEN, NONAKTIF_USER, NONAKTIF_OBAT
  biru: CATAT_BAYAR, LOGIN
  abu: LOGOUT
- Detail: click to expand → tampilkan JSONB as formatted JSON
- Pagination 50 baris per halaman
- Terbaru di atas
- READ-ONLY: tidak ada tombol edit/hapus

Gunakan shadcn DataTable, DateRangePicker, Badge, Collapsible.
TypeScript strict. Empty state yang informatif.
```

---

## SESI 6 — Polish, Error Handling, SQL Setup & README

```
Lanjutkan project RME Praktek Dr. Umum Sudiman. Semua halaman sudah selesai.

Kerjakan finalisasi:

1. Error Handling
- app/error.tsx dan app/not-found.tsx dengan UI friendly Bahasa Indonesia
- Semua server action return { success, error } konsisten
- Error toast yang deskriptif

2. Form Validation dengan Zod
- Validasi semua form client + server
- Pesan error Bahasa Indonesia
- Highlight field error

3. Loading States
- loading.tsx di setiap route segment
- Skeleton loader untuk tabel dan kartu
- Disable tombol submit saat loading (prevent double submit)

4. Keamanan
- Middleware ketat: dokter tidak bisa akses route staf/admin dan sebaliknya
- Halaman periksa: cek kunjungan milik dokter yang login
- Kunjungan sudah selesai → form read-only
- Stok tidak bisa negatif: validasi di server action

5. UX
- Breadcrumb semua halaman
- Konfirmasi dialog sebelum aksi destruktif
- Sidebar collapse di mobile (tablet-friendly min 768px)
- Tabel horizontal scroll di layar kecil

6. database/schema.sql — semua CREATE TABLE, INDEX, dan RLS policies lengkap

7. database/seed.sql:
- 1 admin: admin@prakteksudiman.com
- 1 dokter1: dokter1@prakteksudiman.com
- 1 dokter2: dokter2@prakteksudiman.com
- 1 staf: staf@prakteksudiman.com
- 20 obat umum (Paracetamol 500mg, Amoxicillin 500mg, Antasida, Vitamin C, dll)
- 100 kode ICD-10 paling umum di praktek umum (ISPA, hipertensi, diabetes, diare, dll)

8. README.md lengkap:
- Deskripsi project
- Tech stack
- Setup lokal: clone, install, env variables, jalankan schema.sql, seed.sql, run dev
- Deploy ke Vercel
- Akun default untuk testing
- Struktur folder singkat

Prioritas: security dan error handling dulu, baru UX.
```

---

## Checklist Setelah Setiap Sesi

### Sesi 1
- [ ] Login berhasil & redirect sesuai role
- [ ] Sidebar berbeda per role
- [ ] Logout berfungsi
- [ ] Attendance log terbuat saat login

### Sesi 2
- [ ] Search pasien realtime berfungsi
- [ ] Pasien baru + generate NRM berfungsi
- [ ] Form vital sign + assign dokter berfungsi
- [ ] Antrian realtime update

### Sesi 3
- [ ] Notif realtime masuk ke dokter yang benar
- [ ] Riwayat pasien tampil di kolom kiri
- [ ] Search ICD-10 berfungsi
- [ ] Resep + stok berkurang saat selesai
- [ ] Total bayar terhitung otomatis

### Sesi 4
- [ ] Admin bisa tambah user baru
- [ ] Admin bisa nonaktifkan user/obat
- [ ] Stok obat bisa ditambah
- [ ] Admin bisa edit data pasien

### Sesi 5
- [ ] Attendance tampil jam masuk/keluar per hari
- [ ] Rekap bulanan terhitung
- [ ] Activity log tampil dengan badge warna
- [ ] Filter berfungsi

### Sesi 6
- [ ] Tidak ada route yang bisa diakses role salah
- [ ] Semua form ada validasi Zod
- [ ] Error ditampilkan dengan jelas
- [ ] schema.sql dan seed.sql bisa dijalankan bersih
- [ ] README bisa diikuti dari nol sampai jalan

---

## Tips Saat Pakai Antigravity

- Jika ada error, paste pesan errornya langsung ke Antigravity dan minta fix
- Jika hasil kurang sesuai, tambahkan: "revisi bagian X: ..."
- Antigravity bisa baca file yang sudah ada di project — dia akan otomatis tahu konteks dari sesi sebelumnya
- Kalau ada file yang perlu diupdate dari sesi sebelumnya, sebutkan eksplisit di prompt
