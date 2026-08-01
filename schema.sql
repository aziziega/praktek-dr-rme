-- ==========================================
-- 🏥 SCHEMA DATABASE RME DRA. SUDIMAN
-- ==========================================

-- 1. BERSIHKAN TABEL & FUNGSI SEBELUMNYA (Opsional / Reset)
-- Jalankan ini hanya jika ingin memulai ulang dengan database kosong.
-- DROP TABLE IF EXISTS public.activity_logs CASCADE;
-- DROP TABLE IF EXISTS public.attendance_logs CASCADE;
-- DROP TABLE IF EXISTS public.pembayaran CASCADE;
-- DROP TABLE IF EXISTS public.resep_obat CASCADE;
-- DROP TABLE IF EXISTS public.obat CASCADE;
-- DROP TABLE IF EXISTS public.rekam_medis CASCADE;
-- DROP TABLE IF EXISTS public.kunjungan CASCADE;
-- DROP TABLE IF EXISTS public.pasien CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP FUNCTION IF EXISTS public.get_user_role CASCADE;

-- ==========================================
-- 🗄️ PEMBUATAN TABEL UTAMA (Tabel 'users' Dibuat Pertama)
-- ==========================================

-- Buat tipe ENUM kustom untuk Role User
CREATE TYPE public.user_role AS ENUM ('staf', 'dokter', 'admin');

-- A. Tabel Users (Karyawan & Dokter)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'staf',
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 🔑 HELPER SECURITY FUNCTION (Dibuat setelah tabel 'users' ada)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- 🗄️ PEMBUATAN TABEL-TABEL LAINNYA
-- ==========================================

-- B. Tabel Pasien
CREATE TABLE public.pasien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nrm INT UNIQUE NOT NULL, -- Nomor Rekam Medis (unik, angka saja)
  nama TEXT NOT NULL,
  tanggal_lahir DATE,
  tempat_lahir TEXT,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
  alamat TEXT,
  no_hp TEXT,
  alergi_obat TEXT, -- teks bebas alergi obat
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- C. Tabel Kunjungan
CREATE TABLE public.kunjungan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pasien_id UUID NOT NULL REFERENCES public.pasien(id) ON DELETE CASCADE,
  dokter_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Dokter yang dituju
  staf_id UUID REFERENCES public.users(id) ON DELETE SET NULL,   -- Staf pendaftar
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_daftar TIMESTAMPTZ DEFAULT now(),
  jam_selesai TIMESTAMPTZ,

  -- Vital Sign (Diisi Staf Depan)
  tensi_sistolik INT,       
  tensi_diastolik INT,      
  nadi INT,                 
  suhu NUMERIC(4,1),        
  keluhan_utama TEXT,       

  status TEXT DEFAULT 'menunggu' CHECK (status IN (
    'menunggu',    -- antrean awal
    'diperiksa',   -- di ruang dokter
    'selesai'      -- selesai periksa & bayar
  )),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- D. Tabel Rekam Medis
CREATE TABLE public.rekam_medis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL UNIQUE REFERENCES public.kunjungan(id) ON DELETE CASCADE,
  dokter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,

  -- Diagnosa & Terapi (Diisi Dokter)
  anamnesis TEXT,           
  pemeriksaan_fisik TEXT,   
  diagnosis_kode TEXT,      -- Kode ICD-10 (misal: I10)
  diagnosis_nama TEXT,      -- Nama Diagnosis (misal: Essential hypertension)
  terapi TEXT,              -- Tindakan/terapi non-obat
  catatan TEXT,             

  -- Handwriting canvas image URLs (Supabase Storage)
  anamnesis_handwriting_url TEXT,
  diagnosis_handwriting_url TEXT,
  terapi_handwriting_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- E. Tabel Obat (Master Stok)
CREATE TABLE public.obat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  satuan TEXT NOT NULL,     -- tablet, kapsul, botol, dll
  stok INT NOT NULL DEFAULT 0,
  harga_jual NUMERIC(12,2) NOT NULL DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- F. Tabel Resep Obat (Transaksi Kunjungan)
CREATE TABLE public.resep_obat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL REFERENCES public.kunjungan(id) ON DELETE CASCADE,
  obat_id UUID REFERENCES public.obat(id) ON DELETE SET NULL, -- NULL jika obat racikan/input manual
  nama_obat TEXT NOT NULL,           
  dosis TEXT NOT NULL,               -- aturan pakai (misal: 3x1)
  jumlah INT NOT NULL,               
  harga_satuan NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (jumlah * harga_satuan) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- G. Tabel Pembayaran
CREATE TABLE public.pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL UNIQUE REFERENCES public.kunjungan(id) ON DELETE CASCADE,
  dokter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, 
  tarif_periksa NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_obat NUMERIC(12,2) NOT NULL DEFAULT 0,  
  total_bayar NUMERIC(12,2) NOT NULL,           -- tarif_periksa + total_obat
  metode_bayar TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'lunas' CHECK (status IN ('lunas', 'belum_lunas')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- H. Tabel Log Kehadiran (Attendance Logs)
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_masuk TIMESTAMPTZ NOT NULL,   
  jam_keluar TIMESTAMPTZ,           
  durasi_menit INT,                 
  jumlah_pasien_ditangani INT DEFAULT 0, 
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- I. Tabel Log Aktivitas (Activity Logs / Audit Trail)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  aksi TEXT NOT NULL,         
  target_tabel TEXT,          
  target_id UUID,             
  detail JSONB,               -- Sebelum vs Sesudah perubahan
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ⚡ INDEKS UNTUK MENGOPTIMALKAN QUERY
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_attendance_user_tanggal ON public.attendance_logs(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_aksi ON public.activity_logs(aksi);
CREATE INDEX IF NOT EXISTS idx_kunjungan_tanggal ON public.kunjungan(tanggal);
CREATE INDEX IF NOT EXISTS idx_kunjungan_status ON public.kunjungan(status);

-- ==========================================
-- 🛡️ AKTIVASI ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rekam_medis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resep_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 👥 POLICIES (KEBIJAKAN AKSES KEAMANAN DATA)
-- ==========================================

-- 1. Policies untuk Tabel Users
CREATE POLICY "Semua user terautentikasi bisa membaca list user" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Hanya admin yang bisa memodifikasi data user" ON public.users
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 2. Policies untuk Tabel Pasien
CREATE POLICY "Semua user terautentikasi bisa membaca data pasien" ON public.pasien
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staf dan admin bisa menambah atau edit pasien" ON public.pasien
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('staf', 'admin')
  );

-- 3. Policies untuk Tabel Kunjungan
CREATE POLICY "Semua user terautentikasi bisa membaca antrean kunjungan" ON public.kunjungan
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staf dan admin bisa mendaftarkan & mengatur kunjungan" ON public.kunjungan
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('staf', 'admin')
  );

CREATE POLICY "Dokter bisa memperbarui status kunjungan yang ditugaskan padanya" ON public.kunjungan
  FOR UPDATE TO authenticated USING (
    dokter_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 4. Policies untuk Tabel Rekam Medis
CREATE POLICY "Staf, Dokter, dan Admin bisa membaca rekam medis" ON public.rekam_medis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dokter hanya bisa mengelola rekam medis miliknya sendiri, Admin bebas" ON public.rekam_medis
  FOR ALL TO authenticated USING (
    dokter_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 5. Policies untuk Tabel Obat
CREATE POLICY "Semua user terautentikasi bisa melihat master obat" ON public.obat
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Hanya admin yang bisa memodifikasi stok/daftar obat" ON public.obat
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 6. Policies untuk Tabel Resep Obat
CREATE POLICY "Semua user terautentikasi bisa membaca resep" ON public.resep_obat
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dokter dan Admin bisa mengelola resep obat" ON public.resep_obat
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('dokter', 'admin')
  );

-- 7. Policies untuk Tabel Pembayaran
CREATE POLICY "Semua user terautentikasi bisa melihat rekap pembayaran" ON public.pembayaran
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dokter dan Admin bisa mencatat/mengelola pembayaran" ON public.pembayaran
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IN ('dokter', 'admin')
  );

-- 8. Policies untuk Tabel Attendance Logs (Kehadiran)
CREATE POLICY "User melihat kehadiran miliknya sendiri, Admin melihat semua" ON public.attendance_logs
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "User menginput data log kehadiran masing-masing, Admin bebas" ON public.attendance_logs
  FOR ALL TO authenticated USING (
    user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 9. Policies untuk Tabel Activity Logs (Audit Trail)
CREATE POLICY "Hanya admin yang bisa melihat log aktivitas sistem" ON public.activity_logs
  FOR SELECT TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Semua user terautentikasi bisa menginput log aktivitas dirinya" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
  );

-- ==========================================
-- 📡 SUPABASE REALTIME PUBLICATION
-- ==========================================
-- Tabel yang perlu di-broadcast via Realtime agar client menerima
-- event INSERT/UPDATE/DELETE secara live (tanpa polling/refresh).
-- Jalankan di Supabase Dashboard → SQL Editor.

ALTER PUBLICATION supabase_realtime ADD TABLE public.kunjungan;
