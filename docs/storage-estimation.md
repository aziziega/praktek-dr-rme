# Analisis Skalabilitas & Estimasi Kapasitas Supabase (Free Tier)

Dokumen ini memuat analisis skalabilitas dan estimasi ketahanan kapasitas proyek pada paket **Supabase Free Tier**. Sistem ini dirancang seefisien mungkin agar dapat beroperasi secara gratis selama bertahun-tahun.

## 1. Efisiensi API Request (Database)
Sebelumnya, penyelesaian 1 kunjungan membutuhkan 5-7 *request* terpisah ke database. Dengan mengimplementasikan fungsi SQL (*Postgres RPC*) `selesaikan_kunjungan_trx`, sistem memborong seluruh operasi transaksi dalam **1 Request API**.
- **Limit Supabase Free:** Sangat besar (jutaan *request* per bulan).
- **Estimasi Ketahanan:** **Selamanya** (sangat jauh di bawah batas wajar operasional klinik).

## 2. Kapasitas Database Relasional (Teks & Angka)
- **Limit Supabase Free:** **500 MB**
- 1 transaksi rekam medis beserta obat dan pasien biasanya hanya memakan ruang sekitar 1 KB. 
- 500 MB = 500.000 KB = **500.000 kunjungan pasien**.
- Jika klinik menerima **50 pasien setiap hari** (tanpa hari libur), ruang database untuk teks baru akan penuh dalam **~27 Tahun**. 

## 3. Kapasitas Storage Gambar (Titik Paling Kritis)
Fitur `HandwritingCanvas` menyimpan coretan tangan dokter sebagai gambar PNG berlatar transparan (hanya memuat garis/coretan).
- Ukurannya sangat kecil, rata-rata **15 KB - 30 KB** per gambar.
- **Limit Supabase Free:** **1 GB (1.000.000 KB)**
- 1 Kunjungan pasien maksimal memiliki 3 gambar (Anamnesis, Diagnosis, Terapi). Total alokasi per kunjungan = **~60 KB**.
- Kapasitas maksimal kunjungan: 1.000.000 KB / 60 KB = **~16.666 kunjungan**.
- Jika klinik menerima rata-rata **20 pasien per hari**:
  - 16.666 kunjungan / 20 pasien per hari = **833 hari**.
  - *Storage* ini akan bertahan beroperasi murni secara gratis selama **2 hingga 2,5 Tahun**.

## 4. Bandwidth / Egress (Lalu Lintas Data)
- **Limit Supabase Free:** **2 GB per bulan** (di-reset setiap bulan).
- Bandwidth hanya terkonsumsi ketika menampilkan (memuat) gambar rekam medis masa lalu.
- Asumsi terburuk: Dokter membuka riwayat gambar 20 pasien per hari (20 x 60 KB = 1,2 MB/hari).
- Total dalam 1 bulan (30 hari) = **~36 MB / bulan** (sangat aman dari batas 2.000 MB).

---

## Solusi Jangka Panjang (Setelah 2 Tahun)
Jika kapasitas *storage* gambar sudah mulai mendekati limit 1 GB di masa depan, berikut adalah opsi penyelesaiannya:
1. **Upgrade Paket:** Meng-*upgrade* proyek Supabase ke paket *Pro* (biaya sekitar $25/bulan).
2. **Pembersihan Otomatis (Data Pruning):** Secara berkala (misal tiap 6 bulan) mendelegasikan penghapusan gambar rekam medis lama yang usianya sudah lebih dari 1 atau 2 tahun. Pengguna tetap bisa mengandalkan riwayat teks rekam medisnya tanpa membebani *storage*.
