// =============================================================================
// TypeScript Types — RME Praktek Dr. Sudiman
// Database schema types for all tables
// =============================================================================

// --- Enum Types ---

export type UserRole = 'staf' | 'dokter' | 'admin'
export type JenisKelamin = 'L' | 'P'
export type StatusKunjungan = 'menunggu' | 'diperiksa' | 'selesai'
export type StatusPembayaran = 'lunas' | 'belum_lunas'

// --- Table: users ---

export interface UserRow {
  id: string
  email: string
  nama: string
  role: UserRole
  aktif: boolean
  created_at: string
}

export interface UserInsert {
  id?: string
  email: string
  nama: string
  role: UserRole
  aktif?: boolean
  created_at?: string
}

export interface UserUpdate {
  id?: string
  email?: string
  nama?: string
  role?: UserRole
  aktif?: boolean
  created_at?: string
}

// --- Table: pasien ---

export interface PasienRow {
  id: string
  nrm: number
  nama: string
  tanggal_lahir: string | null
  tempat_lahir: string | null
  jenis_kelamin: JenisKelamin | null
  alamat: string | null
  no_hp: string | null
  alergi_obat: string | null
  created_at: string
  updated_at: string
}

export interface PasienInsert {
  id?: string
  nrm: number
  nama: string
  tanggal_lahir?: string | null
  tempat_lahir?: string | null
  jenis_kelamin?: JenisKelamin | null
  alamat?: string | null
  no_hp?: string | null
  alergi_obat?: string | null
  created_at?: string
  updated_at?: string
}

export interface PasienUpdate {
  id?: string
  nrm?: number
  nama?: string
  tanggal_lahir?: string | null
  tempat_lahir?: string | null
  jenis_kelamin?: JenisKelamin | null
  alamat?: string | null
  no_hp?: string | null
  alergi_obat?: string | null
  created_at?: string
  updated_at?: string
}

// --- Table: kunjungan ---

export interface KunjunganRow {
  id: string
  pasien_id: string
  dokter_id: string | null
  staf_id: string | null
  tanggal: string
  jam_daftar: string
  jam_selesai: string | null
  tensi_sistolik: number | null
  tensi_diastolik: number | null
  nadi: number | null
  suhu: number | null
  keluhan_utama: string | null
  status: StatusKunjungan
  created_at: string
}

export interface KunjunganInsert {
  id?: string
  pasien_id: string
  dokter_id?: string | null
  staf_id?: string | null
  tanggal?: string
  jam_daftar?: string
  jam_selesai?: string | null
  tensi_sistolik?: number | null
  tensi_diastolik?: number | null
  nadi?: number | null
  suhu?: number | null
  keluhan_utama?: string | null
  status?: StatusKunjungan
  created_at?: string
}

export interface KunjunganUpdate {
  id?: string
  pasien_id?: string
  dokter_id?: string | null
  staf_id?: string | null
  tanggal?: string
  jam_daftar?: string
  jam_selesai?: string | null
  tensi_sistolik?: number | null
  tensi_diastolik?: number | null
  nadi?: number | null
  suhu?: number | null
  keluhan_utama?: string | null
  status?: StatusKunjungan
  created_at?: string
}

// --- Table: rekam_medis ---

export interface RekamMedisRow {
  id: string
  kunjungan_id: string
  dokter_id: string
  anamnesis: string | null
  pemeriksaan_fisik: string | null
  diagnosis_kode: string | null
  diagnosis_nama: string | null
  terapi: string | null
  catatan: string | null
  anamnesis_handwriting_url: string | null
  diagnosis_handwriting_url: string | null
  terapi_handwriting_url: string | null
  created_at: string
  updated_at: string
}

export interface RekamMedisInsert {
  id?: string
  kunjungan_id: string
  dokter_id: string
  anamnesis?: string | null
  pemeriksaan_fisik?: string | null
  diagnosis_kode?: string | null
  diagnosis_nama?: string | null
  terapi?: string | null
  catatan?: string | null
  anamnesis_handwriting_url?: string | null
  diagnosis_handwriting_url?: string | null
  terapi_handwriting_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface RekamMedisUpdate {
  id?: string
  kunjungan_id?: string
  dokter_id?: string
  anamnesis?: string | null
  pemeriksaan_fisik?: string | null
  diagnosis_kode?: string | null
  diagnosis_nama?: string | null
  terapi?: string | null
  catatan?: string | null
  anamnesis_handwriting_url?: string | null
  diagnosis_handwriting_url?: string | null
  terapi_handwriting_url?: string | null
  created_at?: string
  updated_at?: string
}

// --- Table: obat ---

export interface ObatRow {
  id: string
  nama: string
  satuan: string
  stok: number
  harga_jual: number
  aktif: boolean
  created_at: string
  updated_at: string
}

export interface ObatInsert {
  id?: string
  nama: string
  satuan: string
  stok?: number
  harga_jual?: number
  aktif?: boolean
  created_at?: string
  updated_at?: string
}

export interface ObatUpdate {
  id?: string
  nama?: string
  satuan?: string
  stok?: number
  harga_jual?: number
  aktif?: boolean
  created_at?: string
  updated_at?: string
}

// --- Table: resep_obat ---

export interface ResepObatRow {
  id: string
  kunjungan_id: string
  obat_id: string | null
  nama_obat: string
  dosis: string
  jumlah: number
  harga_satuan: number
  subtotal: number
  created_at: string
}

export interface ResepObatInsert {
  id?: string
  kunjungan_id: string
  obat_id?: string | null
  nama_obat: string
  dosis: string
  jumlah: number
  harga_satuan: number
  // subtotal is GENERATED ALWAYS — do not insert
  created_at?: string
}

export interface ResepObatUpdate {
  id?: string
  kunjungan_id?: string
  obat_id?: string | null
  nama_obat?: string
  dosis?: string
  jumlah?: number
  harga_satuan?: number
  // subtotal is GENERATED ALWAYS — do not update
  created_at?: string
}

// --- Table: pembayaran ---

export interface PembayaranRow {
  id: string
  kunjungan_id: string
  dokter_id: string
  tarif_periksa: number
  total_obat: number
  total_bayar: number
  metode_bayar: string
  status: StatusPembayaran
  catatan: string | null
  created_at: string
}

export interface PembayaranInsert {
  id?: string
  kunjungan_id: string
  dokter_id: string
  tarif_periksa?: number
  total_obat?: number
  total_bayar: number
  metode_bayar?: string
  status?: StatusPembayaran
  catatan?: string | null
  created_at?: string
}

export interface PembayaranUpdate {
  id?: string
  kunjungan_id?: string
  dokter_id?: string
  tarif_periksa?: number
  total_obat?: number
  total_bayar?: number
  metode_bayar?: string
  status?: StatusPembayaran
  catatan?: string | null
  created_at?: string
}

// --- Table: attendance_logs ---

export interface AttendanceLogRow {
  id: string
  user_id: string
  tanggal: string
  jam_masuk: string
  jam_keluar: string | null
  durasi_menit: number | null
  jumlah_pasien_ditangani: number | null
  ip_address: string | null
  created_at: string
}

export interface AttendanceLogInsert {
  id?: string
  user_id: string
  tanggal?: string
  jam_masuk: string
  jam_keluar?: string | null
  durasi_menit?: number | null
  jumlah_pasien_ditangani?: number | null
  ip_address?: string | null
  created_at?: string
}

export interface AttendanceLogUpdate {
  id?: string
  user_id?: string
  tanggal?: string
  jam_masuk?: string
  jam_keluar?: string | null
  durasi_menit?: number | null
  jumlah_pasien_ditangani?: number | null
  ip_address?: string | null
  created_at?: string
}

// --- Table: activity_logs ---

export interface ActivityLogRow {
  id: string
  user_id: string
  aksi: string
  target_tabel: string | null
  target_id: string | null
  detail: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface ActivityLogInsert {
  id?: string
  user_id: string
  aksi: string
  target_tabel?: string | null
  target_id?: string | null
  detail?: Record<string, unknown> | null
  ip_address?: string | null
  created_at?: string
}

export interface ActivityLogUpdate {
  id?: string
  user_id?: string
  aksi?: string
  target_tabel?: string | null
  target_id?: string | null
  detail?: Record<string, unknown> | null
  ip_address?: string | null
  created_at?: string
}

// --- Table: surat ---

export type TipeSurat = 'sehat' | 'sakit' | 'rujukan'

export interface SuratRow {
  id: string
  pasien_id: string
  kunjungan_id: string | null
  dokter_id: string
  tipe_surat: TipeSurat
  nomor_surat: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SuratInsert {
  id?: string
  pasien_id: string
  kunjungan_id?: string | null
  dokter_id: string
  tipe_surat: TipeSurat
  nomor_surat: string
  data: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface SuratUpdate {
  id?: string
  pasien_id?: string
  kunjungan_id?: string | null
  dokter_id?: string
  tipe_surat?: TipeSurat
  nomor_surat?: string
  data?: Record<string, any>
  created_at?: string
  updated_at?: string
}

// --- Database Umbrella Type (for Supabase generic) ---

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: UserInsert
        Update: UserUpdate
      }
      pasien: {
        Row: PasienRow
        Insert: PasienInsert
        Update: PasienUpdate
      }
      kunjungan: {
        Row: KunjunganRow
        Insert: KunjunganInsert
        Update: KunjunganUpdate
      }
      rekam_medis: {
        Row: RekamMedisRow
        Insert: RekamMedisInsert
        Update: RekamMedisUpdate
      }
      obat: {
        Row: ObatRow
        Insert: ObatInsert
        Update: ObatUpdate
      }
      resep_obat: {
        Row: ResepObatRow
        Insert: ResepObatInsert
        Update: ResepObatUpdate
      }
      pembayaran: {
        Row: PembayaranRow
        Insert: PembayaranInsert
        Update: PembayaranUpdate
      }
      attendance_logs: {
        Row: AttendanceLogRow
        Insert: AttendanceLogInsert
        Update: AttendanceLogUpdate
      }
      activity_logs: {
        Row: ActivityLogRow
        Insert: ActivityLogInsert
        Update: ActivityLogUpdate
      }
      surat: {
        Row: SuratRow
        Insert: SuratInsert
        Update: SuratUpdate
      }
    }
  }
}

