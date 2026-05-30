import { z } from 'zod'

// 1. SKEMA VALIDASI PENGGUNA (USER)
export const userSchema = z.object({
  nama: z.string()
    .min(3, 'Nama harus minimal 3 karakter')
    .max(50, 'Nama maksimal 50 karakter')
    .regex(/^[a-zA-Z\s.,']+$/, 'Nama hanya boleh mengandung huruf, spasi, titik, koma, atau tanda petik'),
  email: z.string()
    .email('Format alamat email tidak valid'),
  role: z.string().refine((val) => ['staf', 'dokter', 'admin'].includes(val), {
    message: 'Peran harus dipilih antara Staf, Dokter, atau Admin'
  }),
  password: z.string()
    .min(6, 'Kata sandi harus minimal 6 karakter')
    .optional()
    .or(z.literal(''))
})

// 2. SKEMA VALIDASI PASIEN (PASIEN)
export const pasienSchema = z.object({
  nrm: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.any()
  ).refine((val) => val !== undefined && typeof val === 'number' && !isNaN(val) && Number.isInteger(val) && val > 0, {
    message: 'Nomor Rekam Medis wajib diisi, berupa angka bulat positif'
  }),
  nama: z.string()
    .min(3, 'Nama pasien harus minimal 3 karakter')
    .max(60, 'Nama pasien maksimal 60 karakter')
    .regex(/^[a-zA-Z\s.,'()]+$/, 'Nama hanya boleh huruf, spasi, titik, koma, kurung, atau petik'),
  tanggal_lahir: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Tanggal lahir tidak valid')
    .optional()
    .or(z.literal('')),
  tempat_lahir: z.string()
    .min(3, 'Tempat lahir harus minimal 3 karakter')
    .max(50, 'Tempat lahir maksimal 50 karakter'),
  jenis_kelamin: z.string().refine((val) => ['L', 'P'].includes(val), {
    message: 'Jenis kelamin harus dipilih antara Laki-laki (L) atau Perempuan (P)'
  }),
  alamat: z.string()
    .min(5, 'Alamat lengkap minimal 5 karakter')
    .max(200, 'Alamat lengkap maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  no_hp: z.string()
    .regex(/^[0-9+-\s]{8,15}$/, 'Nomor HP tidak valid (8-15 digit angka)')
    .optional()
    .or(z.literal('')),
  alergi_obat: z.string()
    .max(200, 'Keterangan alergi obat maksimal 200 karakter')
    .optional()
    .or(z.literal(''))
})

// 3. SKEMA VALIDASI MASTER OBAT (OBAT)
export const obatSchema = z.object({
  nama: z.string()
    .min(2, 'Nama obat harus minimal 2 karakter')
    .max(60, 'Nama obat maksimal 60 karakter'),
  satuan: z.string()
    .min(2, 'Satuan obat wajib diisi (misal: tablet, botol)')
    .max(20, 'Satuan obat maksimal 20 karakter'),
  stok: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number()
      .int('Jumlah stok harus bilangan bulat')
      .nonnegative('Jumlah stok tidak boleh negatif')
  ),
  harga_jual: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number()
      .positive('Harga jual obat harus bernilai positif')
  )
})

// 4. SKEMA VALIDASI REKAM MEDIS & VITAL SIGNS (REKAM MEDIS)
export const rekamMedisSchema = z.object({
  anamnesis: z.string()
    .min(5, 'Catatan Anamnesis / Pemeriksaan minimal 5 karakter'),
  pemeriksaan_fisik: z.string().optional().or(z.literal('')),
  diagnosis_kode: z.string()
    .min(3, 'Kode ICD-10 wajib diisi (contoh: I10, A09)')
    .max(10, 'Kode ICD-10 maksimal 10 karakter'),
  diagnosis_nama: z.string()
    .min(3, 'Nama diagnosis wajib diisi')
    .max(100, 'Nama diagnosis maksimal 100 karakter'),
  terapi: z.string()
    .min(3, 'Tindakan atau terapi wajib diisi'),
  catatan: z.string().optional().or(z.literal(''))
})
