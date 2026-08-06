# Checklist Pertanyaan & Konfirmasi Klien (Pitch Deck)

Gunakan daftar pertanyaan ini saat sesi *pitching* atau *requirement gathering* bersama klien (Pemilik Klinik atau Dokter) untuk menggali kebutuhan operasional nyata mereka sekaligus menunjukkan profesionalitas sistem Anda.

## 1. Kebutuhan Meja Depan (Front Desk) & Pendaftaran
- [ ] **Cetak Karcis & Struk Antrian:** Apakah klinik membutuhkan fitur cetak struk antrian menggunakan printer *thermal* kecil untuk pasien yang baru mendaftar?
- [ ] **Pembatalan Kunjungan:** Bagaimana prosedur operasional jika pasien yang sudah terdaftar tiba-tiba batal periksa? Apakah diperlukan fitur khusus untuk membatalkan kunjungan (tanpa menghapus data pasien)?
- [ ] **Pendaftaran Online:** Apakah ada rencana ke depan untuk mengizinkan pasien mendaftar mandiri via WhatsApp atau aplikasi?

## 2. Kebutuhan Ruang Praktik (Dokter)
- [ ] **Surat Menyurat Medis:** Seberapa sering dokter perlu mengeluarkan Surat Keterangan Sakit, Surat Sehat, atau Rujukan? Apakah diperlukan fitur "1-Klik Cetak Surat" (otomatis berformat PDF lengkap dengan Kop Klinik)?
- [ ] **Upload Lampiran Fisik:** Selain mencoret (*drawing*) rekam medis, apakah dokter butuh ruang untuk mengunggah berkas fisik pasien (misal: foto rontgen, hasil lab darah, atau foto luka) ke dalam aplikasi?

## 3. Kebutuhan Kasir & Farmasi
- [ ] **Metode Pembayaran Kasir:** Apakah klinik hanya menerima pembayaran Tunai (*Cash*)? Atau aplikasi butuh mencatat pembagian omzet berdasarkan metode QRIS, EDC/Debit, dan Transfer Bank?
- [ ] **Kwitansi Bukti Bayar:** Setelah kunjungan selesai dibayar, apakah kasir wajib memberikan struk/kwitansi cetak kepada pasien?
- [ ] **Manajemen Obat Racikan:** Apakah klinik melayani peracikan obat (misal: 1 puyer berisi setengah tablet obat A dan seperempat tablet obat B)? Jika ya, bagaimana cara klinik memotong stok fisiknya selama ini?

## 4. Kebutuhan Owner (Laporan & Keuangan)
- [ ] **Laba Bersih vs Pendapatan:** Apakah Laporan Keuangan hanya butuh menampilkan Total Omzet (Uang Masuk)? Atau *Owner* ingin melihat **Laba Bersih**? *(Bila laba bersih, maka sistem harus dibuatkan fitur input Harga Modal/HPP Obat).*
- [ ] **Komisi (Fee) Dokter:** Apakah sistem penggajian dokter menggunakan persentase bagi hasil per pasien? Apakah sistem perlu menghitungkan total komisi dokter secara otomatis tiap akhir bulan?

## 5. Kebutuhan Premium / Skala Enterprise
*Bagian ini sangat bagus ditanyakan untuk memancing ketertarikan klien terhadap rencana kerja sama jangka panjang (Roadmap Fase 2).*
- [ ] **Retensi via WhatsApp Otomatis:** Apakah klinik tertarik memiliki Asisten Bot WhatsApp yang mengirimkan pengingat jadwal kontrol H-1 secara otomatis agar pasien tidak lupa datang kembali?
- [ ] **Kepatuhan Medis (ICD-10 & SatuSehat):** Apakah klinik melayani asuransi/BPJS sehingga ketikan diagnosis dokter harus dipilih dari kamus penyakit standar WHO (ICD-10)? Apakah klinik ada target untuk wajib terintegrasi dengan platform SatuSehat Kemenkes RI tahun depan?
- [ ] **Keamanan Hukum (Audit Log):** Untuk melindungi integritas rekam medis dari sengketa/malapraktik, apakah klinik butuh sistem keamanan ketat yang mencatat histori "Siapa mengubah data apa dan pada jam berapa" yang tidak bisa dihapus oleh staf manapun?
