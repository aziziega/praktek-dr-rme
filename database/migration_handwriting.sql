-- ==========================================
-- 📝 MIGRATION: ADD HANDWRITING CANVAS URLS TO REKAM_MEDIS
-- ==========================================
-- Run this script in Supabase Dashboard -> SQL Editor

ALTER TABLE public.rekam_medis
ADD COLUMN IF NOT EXISTS anamnesis_handwriting_url TEXT,
ADD COLUMN IF NOT EXISTS diagnosis_handwriting_url TEXT,
ADD COLUMN IF NOT EXISTS terapi_handwriting_url TEXT;

COMMENT ON COLUMN public.rekam_medis.anamnesis_handwriting_url IS 'URL PNG gambar tulisan tangan untuk Anamnesis';
COMMENT ON COLUMN public.rekam_medis.diagnosis_handwriting_url IS 'URL PNG gambar tulisan tangan untuk Diagnosis';
COMMENT ON COLUMN public.rekam_medis.terapi_handwriting_url IS 'URL PNG gambar tulisan tangan untuk Terapi';
