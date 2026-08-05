CREATE OR REPLACE FUNCTION selesaikan_kunjungan_trx(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kunjungan_id uuid;
  v_dokter_id uuid;
  v_tarif_periksa numeric;
  v_total_obat numeric := 0;
  v_total_bayar numeric := 0;
  v_status_kunjungan text;
  v_item jsonb;
  v_obat_id uuid;
  v_jumlah int;
  v_stok_sekarang int;
  v_nama_obat text;
  v_attendance_id uuid;
  v_jumlah_pasien int;
BEGIN
  -- 1. Parse payload dasar
  v_kunjungan_id := (payload->>'kunjunganId')::uuid;
  v_dokter_id := (payload->>'dokterId')::uuid;
  v_tarif_periksa := (payload->>'tarif_periksa')::numeric;

  -- 2. Cek eksistensi dan status kunjungan (Idempotensi & Keamanan)
  SELECT status INTO v_status_kunjungan 
  FROM kunjungan 
  WHERE id = v_kunjungan_id AND dokter_id = v_dokter_id
  FOR UPDATE; -- Mengunci baris kunjungan ini selama transaksi

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kunjungan tidak ditemukan atau Anda tidak memiliki akses.';
  END IF;

  IF v_status_kunjungan = 'selesai' THEN
    RAISE EXCEPTION 'Kunjungan sudah diselesaikan sebelumnya.';
  END IF;

  -- 3. Verifikasi stok obat terlebih dahulu
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'resepItems')
  LOOP
    IF v_item->>'obat_id' IS NOT NULL THEN
      v_obat_id := (v_item->>'obat_id')::uuid;
      v_jumlah := (v_item->>'jumlah')::int;
      
      -- Kunci baris obat untuk dicek
      SELECT stok, nama INTO v_stok_sekarang, v_nama_obat 
      FROM obat 
      WHERE id = v_obat_id 
      FOR UPDATE;

      IF v_stok_sekarang < v_jumlah THEN
        RAISE EXCEPTION 'Stok obat "%" tidak mencukupi. Tersedia: %, Diminta: %', v_nama_obat, v_stok_sekarang, v_jumlah;
      END IF;
    END IF;
  END LOOP;

  -- 4a. Update vital sign pada kunjungan
  UPDATE kunjungan SET 
    tensi_sistolik = (payload->>'tensi_sistolik')::int,
    tensi_diastolik = (payload->>'tensi_diastolik')::int,
    nadi = (payload->>'nadi')::int,
    suhu = (payload->>'suhu')::numeric
  WHERE id = v_kunjungan_id;

  -- 4b. Simpan / Update rekam medis
  INSERT INTO rekam_medis (
    kunjungan_id, anamnesis, pemeriksaan_fisik, diagnosis_kode, diagnosis_nama, 
    terapi, catatan, anamnesis_handwriting_url, diagnosis_handwriting_url, 
    terapi_handwriting_url
  ) VALUES (
    v_kunjungan_id, 
    payload->>'anamnesis', 
    payload->>'pemeriksaan_fisik', 
    payload->>'diagnosis_kode', 
    payload->>'diagnosis_nama', 
    payload->>'terapi', 
    payload->>'catatan_medis', 
    payload->>'anamnesis_handwriting_url', 
    payload->>'diagnosis_handwriting_url', 
    payload->>'terapi_handwriting_url'
  )
  ON CONFLICT (kunjungan_id) DO UPDATE SET
    anamnesis = EXCLUDED.anamnesis,
    pemeriksaan_fisik = EXCLUDED.pemeriksaan_fisik,
    diagnosis_kode = EXCLUDED.diagnosis_kode,
    diagnosis_nama = EXCLUDED.diagnosis_nama,
    terapi = EXCLUDED.terapi,
    catatan = EXCLUDED.catatan,
    anamnesis_handwriting_url = EXCLUDED.anamnesis_handwriting_url,
    diagnosis_handwriting_url = EXCLUDED.diagnosis_handwriting_url,
    terapi_handwriting_url = EXCLUDED.terapi_handwriting_url,
    updated_at = NOW();

  -- 5. Hapus resep lama dan insert resep baru
  DELETE FROM resep_obat WHERE kunjungan_id = v_kunjungan_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'resepItems')
  LOOP
    INSERT INTO resep_obat (
      kunjungan_id, obat_id, nama_obat, dosis, jumlah, harga_satuan
    ) VALUES (
      v_kunjungan_id, 
      NULLIF(v_item->>'obat_id', '')::uuid, 
      v_item->>'nama_obat', 
      v_item->>'dosis', 
      (v_item->>'jumlah')::int, 
      (v_item->>'harga_satuan')::numeric
    );

    v_total_obat := v_total_obat + ((v_item->>'jumlah')::int * (v_item->>'harga_satuan')::numeric);
  END LOOP;

  v_total_bayar := v_tarif_periksa + v_total_obat;

  -- 6. Insert pembayaran
  INSERT INTO pembayaran (
    kunjungan_id, dokter_id, tarif_periksa, total_obat, total_bayar, metode_bayar, status, catatan
  ) VALUES (
    v_kunjungan_id, v_dokter_id, v_tarif_periksa, v_total_obat, v_total_bayar, 'cash', 'lunas', payload->>'catatan_bayar'
  );

  -- 7. Kurangi stok obat (sudah di-lock dan dicek di langkah 3)
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'resepItems')
  LOOP
    IF v_item->>'obat_id' IS NOT NULL THEN
      UPDATE obat 
      SET stok = stok - (v_item->>'jumlah')::int, updated_at = NOW() 
      WHERE id = (v_item->>'obat_id')::uuid;
    END IF;
  END LOOP;

  -- 8. Update status kunjungan
  UPDATE kunjungan 
  SET status = 'selesai', jam_selesai = NOW(), updated_at = NOW() 
  WHERE id = v_kunjungan_id;

  -- 9. Update attendance logs (jumlah pasien ditangani)
  SELECT id, jumlah_pasien_ditangani INTO v_attendance_id, v_jumlah_pasien
  FROM attendance_logs
  WHERE user_id = v_dokter_id 
    AND tanggal = (payload->>'tanggal_hari_ini')::date;

  IF FOUND THEN
    UPDATE attendance_logs
    SET jumlah_pasien_ditangani = COALESCE(v_jumlah_pasien, 0) + 1, updated_at = NOW()
    WHERE id = v_attendance_id;
  END IF;

  -- 10. Log aktivitas
  INSERT INTO activity_logs (user_id, aksi, target_tabel, target_id, detail)
  VALUES (
    v_dokter_id, 
    'SIMPAN_REKAM_MEDIS', 
    'rekam_medis', 
    v_kunjungan_id, 
    jsonb_build_object('diagnosis', COALESCE(payload->>'diagnosis_nama', '-'))
  );

  INSERT INTO activity_logs (user_id, aksi, target_tabel, target_id, detail)
  VALUES (
    v_dokter_id, 
    'CATAT_BAYAR', 
    'pembayaran', 
    v_kunjungan_id, 
    jsonb_build_object(
      'tarif_periksa', v_tarif_periksa,
      'total_obat', v_total_obat,
      'total_bayar', v_total_bayar
    )
  );

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
