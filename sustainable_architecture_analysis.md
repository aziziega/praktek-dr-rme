# 🏥 Analisis Arsitektur & Keberlanjutan (Sustainability) RME Dr. Sudiman

Analisis mendalam mengenai potensi hambatan performa (*performance bottlenecks*), masalah skalabilitas, dan risiko teknis jangka panjang pada sistem Rekam Medis Elektronik (RME) ini, serta rekomendasi solusi konkret untuk bahan *brainstorming*.

---

## 1. 🗄️ Database & Schema Bottlenecks (Potensi Bottleneck Terbesar)

### A. Indeks pada Foreign Keys (FK) yang Hilang
*   **Masalah:** PostgreSQL secara default **tidak** membuat indeks secara otomatis pada kolom *Foreign Key* (FK). Di dalam [schema.sql](file:///d:/project/praktek-dr-rme/schema.sql), kolom FK penting seperti `pasien_id`, `dokter_id`, dan `obat_id` tidak memiliki indeks.
*   **Dampak:** Ketika jumlah data kunjungan mencapai puluhan ribu, pencarian riwayat pasien (`WHERE pasien_id = ...`) atau penyaringan antrean dokter (`WHERE dokter_id = ...`) akan memicu **Sequential Scan** (membaca seluruh tabel dari baris pertama sampai akhir). Hal ini membuat kueri melambat secara eksponensial seiring bertambahnya data pasien.
*   **Solusi Brainstorming:** Buat indeks pada kolom FK utama:
    ```sql
    CREATE INDEX IF NOT EXISTS idx_kunjungan_pasien ON public.kunjungan(pasien_id);
    CREATE INDEX IF NOT EXISTS idx_kunjungan_dokter ON public.kunjungan(dokter_id);
    CREATE INDEX IF NOT EXISTS idx_resep_kunjungan ON public.resep_obat(kunjungan_id);
    CREATE INDEX IF NOT EXISTS idx_resep_obat ON public.resep_obat(obat_id);
    ```

### B. Ledakan Data Audit Trail (`activity_logs`)
*   **Masalah:** Setiap kali ada aksi penting (tambah pasien, edit pasien, simpan rekam medis, dll.), sistem memanggil `logActivity` yang menyimpan data format `JSONB` ke tabel `activity_logs`. 
*   **Dampak:** Tabel log audit biasanya tumbuh 10–50x lebih cepat daripada tabel operasional. Query ke `activity_logs` di halaman admin akan melambat jika tidak dibatasi. Selain itu, penyimpanan database Supabase (tier gratis/berbayar) akan cepat penuh oleh log sistem.
*   **Solusi Brainstorming:**
    1.  **Retention Policy (Kebijakan Penghapusan):** Jadwalkan pembersihan otomatis (misal menggunakan Supabase pg_cron) untuk menghapus log yang lebih tua dari 6 bulan atau 1 tahun.
    2.  **Archiving (Pengarsipan):** Backup log lama ke berkas CSV/JSON lalu simpan di *Supabase Storage* (Object Storage jauh lebih murah daripada Database Storage), lalu kosongkan tabel log database.

### C. Kurangnya Batasan Riwayat Kunjungan pada Staf
*   **Masalah:** Fungsi [getRiwayatKunjunganPasienStaf](file:///d:/project/praktek-dr-rme/app/actions/staf.ts#L405-L430) mengambil seluruh riwayat kunjungan pasien beserta rekam medis dan resep obatnya tanpa batasan (`limit`) atau paginasi.
*   **Dampak:** Untuk pasien kronis yang berobat rutin selama bertahun-tahun (misalnya dengan 100+ kunjungan), membuka profil pasien tersebut di halaman staf akan mengunduh payload JSON raksasa yang tidak perlu.
*   **Solusi Brainstorming:** Berikan batasan default (misal `.limit(20)`) atau terapkan paginasi server-side pada halaman riwayat pasien staf.

---

## 2. ⚡ Serverless & API Performance (Next.js & Vercel Latency)

### A. Masalah Cold Starts & Koneksi Database Serverless
*   **Masalah:** Vercel menggunakan arsitektur *Serverless Functions*. Setiap kali Server Action dipanggil, Vercel dapat memicu instansiasi fungsi baru (*cold start*) yang memakan waktu 1–3 detik. Selain itu, setiap pemanggilan fungsi membuka koneksi baru ke database PostgreSQL Supabase.
*   **Dampak:** Di bawah beban ramai, database bisa terkena *Connection Exhaustion* (kehabisan batas koneksi PostgreSQL).
*   **Solusi Brainstorming:**
    1.  **Connection Pooling:** Gunakan URI koneksi pooling Supabase (Supavisor port 6543 dengan mode `transaction`) di variabel lingkungan production (`DATABASE_URL`), bukan koneksi langsung port 5432.
    2.  **Edge Runtime:** Untuk kueri-kueri ringan yang membutuhkan performa sangat cepat, pertimbangkan memindahkan API route ke Next.js Edge Runtime.

### B. Belum Adanya Caching Data Statis/Master
*   **Masalah:** Daftar obat aktif (`obat`) dan daftar dokter aktif (`users` dengan role dokter) jarang berubah. Namun, setiap kali staf membuka formulir pendaftaran, sistem melakukan query database langsung untuk mengambil daftar dokter.
*   **Dampak:** Membebani database dengan kueri berulang untuk data yang sama.
*   **Solusi Brainstorming:** Manfaatkan Next.js `unstable_cache` atau React `cache` untuk menyimpan daftar obat dan daftar dokter aktif selama beberapa menit/jam.
    ```typescript
    import { unstable_cache } from 'next/cache'
    export const getCachedActiveDokters = unstable_cache(
      async () => getActiveDokters(),
      ['active-dokters'],
      { revalidate: 3600 } // cache 1 jam
    )
    ```

---

## 3. 🔄 Realtime Listener & UI Overhead

### A. Subskripsi Realtime Tanpa Filter Spesifik
*   **Masalah:** Komponen [AntrianDokterClient.tsx](file:///d:/project/praktek-dr-rme/components/dokter/AntrianDokterClient.tsx#L145-L184) berlangganan ke seluruh perubahan di tabel `kunjungan` untuk satu tanggal tertentu.
*   **Dampak:** Walaupun difilter secara berkala di sisi klien (`newRow.dokter_id === dokterId`), klien dokter tetap menerima semua lalu lintas (traffic) perubahan data kunjungan dokter-dokter lainnya dari websocket Supabase. Di klinik dengan banyak dokter, ini membebani bandwidth peramban dokter.
*   **Solusi Brainstorming:** Manfaatkan fitur filter Supabase Realtime di level kueri subskripsi (jika didukung oleh skema RLS/Realtime):
    ```typescript
    // Filter langsung dari server Supabase agar hanya menerima event untuk dokter bersangkutan
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'kunjungan',
      filter: `dokter_id=eq.${dokterId}`
    }, callback)
    ```

### B. Debounce Auto-Save Rekam Medis (API Call Overhead)
*   **Masalah:** Saat dokter mengetik di [TabRekamMedis.tsx](file:///d:/project/praktek-dr-rme/components/dokter/TabRekamMedis.tsx), sistem melakukan auto-save ke database server setiap jeda ketik 2 detik.
*   **Dampak:** Jika ada 5 dokter mengetik bersamaan, ini akan mengirimkan puluhan request tulis database per minute.
*   **Solusi Brainstorming:**
    1.  **Draft Lokal:** Simpan draf ketikan ke `localStorage` browser terlebih dahulu (sangat murah/gratis) setiap kali mengetik.
    2.  **Interval Server Save:** Kirim perubahan ke database server dengan interval yang lebih longgar (misal tiap 30 detik atau 1 menit), atau gunakan tombol manual simpan draf dengan indikator visual penanda *"Ada perubahan yang belum disimpan"*.
