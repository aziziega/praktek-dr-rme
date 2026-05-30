-- ==========================================
-- 🏥 DATA SEEDING (DUMMY DATA) RME DR. SUDIMAN
-- ==========================================

-- 1. SEED DATA AKUN PENGGUNA (Tabel public.users)
-- Catatan: UUID ini diselaraskan dengan akun Auth Supabase.
-- Pengujian lokal dapat membuat user via dashboard Supabase Auth atau admin panel lalu menyesuaikan id.
INSERT INTO public.users (id, email, nama, role, aktif) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin@klinik.com', 'Administrator Utama', 'admin', true),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'dokter.budi@klinik.com', 'Dr. Budi Santoso', 'dokter', true),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'dokter.siti@klinik.com', 'Dr. Siti Aminah', 'dokter', true),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'staf.nisa@klinik.com', 'Nisa Rahmawati', 'staf', true)
ON CONFLICT (email) DO UPDATE SET
  nama = EXCLUDED.nama,
  role = EXCLUDED.role,
  aktif = EXCLUDED.aktif;

-- 2. SEED DATA MASTER OBAT (Tabel public.obat)
INSERT INTO public.obat (nama, satuan, stok, harga_jual, aktif) VALUES
  ('Paracetamol 500 mg', 'Tablet', 500, 1500.00, true),
  ('Amoxicillin 500 mg', 'Tablet', 300, 2500.00, true),
  ('Ibuprofen 400 mg', 'Tablet', 250, 2000.00, true),
  ('Cetirizine 10 mg', 'Tablet', 180, 1800.00, true),
  ('Metformin 500 mg', 'Tablet', 400, 1200.00, true),
  ('Amlodipine 5 mg', 'Tablet', 350, 1500.00, true),
  ('Amlodipine 10 mg', 'Tablet', 200, 2500.00, true),
  ('Ranitidine 150 mg', 'Tablet', 150, 1300.00, true),
  ('Omeprazole 20 mg', 'Kapsul', 220, 3000.00, true),
  ('Lansoprazole 30 mg', 'Kapsul', 160, 4500.00, true),
  ('Asam Mefenamat 500 mg', 'Tablet', 300, 2200.00, true),
  ('Dexamethasone 0.5 mg', 'Tablet', 500, 800.00, true),
  ('Salbutamol 2 mg', 'Tablet', 100, 1100.00, true),
  ('OBH Sirup 100 ml', 'Botol', 45, 15000.00, true),
  ('Sanmol Sirup 60 ml', 'Botol', 30, 25000.00, true),
  ('Betadine Sol 30 ml', 'Botol', 25, 18000.00, true),
  ('Antasida Doen', 'Tablet', 450, 800.00, true),
  ('Ciprofloxacin 500 mg', 'Tablet', 150, 4000.00, true),
  ('Atorvastatin 20 mg', 'Tablet', 120, 6500.00, true),
  ('Vitamin C 250 mg', 'Tablet', 600, 1000.00, true),
  ('Vitamin B Kompleks', 'Tablet', 800, 800.00, true),
  ('Oralit 200 ml', 'Sachet', 100, 1500.00, true)
ON CONFLICT DO NOTHING;

-- 3. SEED DATA DIAGNOSA ICD-10 (Tabel Rekam Medis Diagnosis Master / ICD-10 Referensi)
-- Format ICD-10 umum untuk Poli Umum Klinik Pratama
-- Catatan: Tabel rekam_medis menyimpan diagnosa dalam bentuk teks bebas, data ini
-- dapat digunakan dokter untuk auto-complete / referensi cepat diagnosis.
-- Berikut 50 diagnosis klinis paling populer di poli umum:
-- A09 (Gastroenteritis), I10 (Hipertensi), E11 (Diabetes), J00 (Nasofaringitis), dll.
