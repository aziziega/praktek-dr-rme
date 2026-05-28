# 📋 Project Brief — RME Praktek Dr. Umum Sudiman
> Rekam Medis Elektronik · Phase 1
> Dibuat untuk implementasi dengan Claude Code (claude-opus-4-6) via Antigravity

---

## 🏥 Tentang Project

| | |
|---|---|
| **Nama Praktek** | Praktek Dr. Umum Sudiman |
| **Alamat** | Gupolo Rt. 04 Rw. 02, Cucukan, Prambanan, Klaten 57454 |
| **Kondisi Saat Ini** | Rekam medis full manual, kertas, sudah berjalan 10+ tahun |
| **Jumlah Dokter** | 2 dokter (Dr. Sudiman + 1 dokter lain) |
| **Jumlah Staf Depan** | ~1-2 orang |
| **Pasien Existing** | 8000+ pasien dengan NRM (Nomor Rekam Medis) fisik |
| **Koneksi Internet** | WiFi tersedia ✅ |
| **SIP** | Sudah dimiliki ✅ |
| **Pembayaran** | Cash langsung ke dokter |

---

## 🎯 Tujuan Phase 1

Menggantikan proses pencarian berkas manual dan pencatatan rekam medis kertas menjadi digital, **tanpa mengubah habit kerja terlalu drastis** — khususnya mengingat salah satu dokter (Dr. Sudiman) masih konvensional.

**Termasuk tujuan Phase 1:**
- Pendaftaran & rekam medis digital
- Realtime notifikasi dokter
- Resep, obat & pembayaran oleh dokter
- Manajemen stok obat
- **Attendance logs staf & dokter**
- **Activity log / audit trail seluruh operasional**
- Manajemen user oleh admin (tambah/edit/nonaktifkan dokter & staf)

**Bukan tujuan Phase 1:**
- Antrian digital (tetap kertas dulu)
- Integrasi Satu Sehat (Phase 2)
- Laporan/dashboard (Phase 2)
- Migrasi data lama (bertahap, opsional)

---

## 👥 User Roles & Akses

| Role | Siapa | Akses |
|---|---|---|
| `staf` | Penjaga/resepsionis depan | Pendaftaran pasien, cari NRM, input vital sign, assign ke dokter, kasir |
| `dokter` | Dokter 1 atau Dokter 2 | Lihat antrian masuk, buka rekam medis, input pemeriksaan, diagnosis, resep & obat, catat pembayaran |
| `admin` | Owner/Dr. Sudiman (jika mau) | Semua akses staf + dokter, manajemen user, stok obat |

> **Catatan:** Dokter yang tidak setuju sistem (Dr. Sudiman) bisa tetap pakai kertas. Staf depan yang input. Jadi sistem tidak memaksa dokter buka laptop — tapi kalau mau, bisa.

---

## 🔄 Flow Baru (Phase 1)

```
PASIEN DATANG
     │
     ▼
[STAF DEPAN]
1. Pasien ambil nomor antrian kertas (tetap manual)
2. Staf buka sistem → cari pasien by NRM / nama / tgl lahir
3. Jika pasien baru → input data pasien → sistem generate NRM baru
4. Input vital sign: tensi, nadi, suhu, keluhan utama
5. Pilih assign ke → Dokter 1 atau Dokter 2
6. Submit → kunjungan terdaftar di sistem
     │
     ▼
[DOKTER 1 / DOKTER 2]
7. Sistem notifikasi realtime: ada pasien baru masuk
8. Dokter buka daftar pasien hari ini (yang di-assign ke mereka)
9. Buka rekam medis pasien → lihat riwayat kunjungan sebelumnya
10. Input pemeriksaan:
    - Anamnesis (keluhan detail)
    - Hasil pemeriksaan fisik
    - Diagnosis (dengan kode ICD-10)
    - Terapi / tindakan
11. Input resep & obat:
    - Nama obat, dosis, jumlah, harga satuan
    - Sistem otomatis kurangi stok obat
12. Input tarif periksa
13. Simpan → rekam medis tersimpan
     │
     ▼
[KASIR / PEMBAYARAN — dilakukan oleh Dokter]
14. Sistem generate total tagihan otomatis:
    Total = tarif periksa + total harga obat
15. Dokter catat: pasien sudah bayar cash
16. Status kunjungan → SELESAI
     │
     ▼
[STAF DEPAN]
17. Bisa lihat status pasien sudah selesai
18. Pasien pulang
```

---

## 🗄️ Database Schema (PostgreSQL — Supabase)

### Tabel `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staf', 'dokter', 'admin')),
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `pasien`
```sql
CREATE TABLE pasien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nrm TEXT UNIQUE NOT NULL, -- Nomor Rekam Medis, bisa generate otomatis atau input manual (untuk pasien lama)
  nama TEXT NOT NULL,
  tanggal_lahir DATE,
  tempat_lahir TEXT,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
  alamat TEXT,
  no_hp TEXT,
  alergi_obat TEXT, -- free text, misal "Penisilin, Sulfa"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `kunjungan`
```sql
CREATE TABLE kunjungan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pasien_id UUID NOT NULL REFERENCES pasien(id),
  dokter_id UUID REFERENCES users(id), -- NULL kalau belum di-assign
  staf_id UUID REFERENCES users(id),   -- siapa yang daftar
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_daftar TIMESTAMPTZ DEFAULT now(),
  jam_selesai TIMESTAMPTZ,

  -- Vital sign (diisi staf depan)
  tensi_sistolik INT,       -- misal 120
  tensi_diastolik INT,      -- misal 80
  nadi INT,                 -- per menit
  suhu NUMERIC(4,1),        -- misal 36.7
  keluhan_utama TEXT,       -- diisi staf, keluhan awal pasien

  status TEXT DEFAULT 'menunggu' CHECK (status IN (
    'menunggu',    -- sudah daftar, belum ke dokter
    'diperiksa',   -- sedang di ruang dokter
    'selesai'      -- sudah selesai & bayar
  )),

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `rekam_medis`
```sql
CREATE TABLE rekam_medis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL UNIQUE REFERENCES kunjungan(id),
  dokter_id UUID NOT NULL REFERENCES users(id),

  -- Diisi dokter
  anamnesis TEXT,           -- keluhan detail dari dokter
  pemeriksaan_fisik TEXT,   -- hasil periksa
  diagnosis_kode TEXT,      -- kode ICD-10, misal "I10"
  diagnosis_nama TEXT,      -- nama diagnosis, misal "Hipertensi primer"
  terapi TEXT,              -- tindakan / terapi selain obat
  catatan TEXT,             -- catatan tambahan dokter

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `obat` (master stok obat)
```sql
CREATE TABLE obat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  satuan TEXT NOT NULL,     -- misal "tablet", "kapsul", "botol", "ampul"
  stok INT NOT NULL DEFAULT 0,
  harga_jual NUMERIC(12,2) NOT NULL DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `resep_obat`
```sql
CREATE TABLE resep_obat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL REFERENCES kunjungan(id),
  obat_id UUID REFERENCES obat(id),  -- NULL jika obat belum di master (input manual)
  nama_obat TEXT NOT NULL,           -- nama obat (redundan, untuk jaga-jaga obat dihapus)
  dosis TEXT NOT NULL,               -- misal "3x1", "2x500mg"
  jumlah INT NOT NULL,               -- jumlah yang diberikan
  harga_satuan NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (jumlah * harga_satuan) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `pembayaran`
```sql
CREATE TABLE pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL UNIQUE REFERENCES kunjungan(id),
  dokter_id UUID NOT NULL REFERENCES users(id), -- dokter yang catat pembayaran
  tarif_periksa NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_obat NUMERIC(12,2) NOT NULL DEFAULT 0,  -- sum dari resep_obat
  total_bayar NUMERIC(12,2) NOT NULL,           -- tarif_periksa + total_obat
  metode_bayar TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'lunas' CHECK (status IN ('lunas', 'belum_lunas')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```


### Tabel `attendance_logs`
```sql
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_masuk TIMESTAMPTZ NOT NULL,   -- otomatis saat login pertama hari itu
  jam_keluar TIMESTAMPTZ,           -- otomatis saat logout / session expired
  durasi_menit INT,                 -- dihitung otomatis: jam_keluar - jam_masuk
  jumlah_pasien_ditangani INT DEFAULT 0, -- dihitung dari kunjungan selesai hari itu
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Index untuk query rekap bulanan
CREATE INDEX idx_attendance_user_tanggal ON attendance_logs(user_id, tanggal);
```

### Tabel `activity_logs`
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  aksi TEXT NOT NULL,         -- misal: 'LOGIN', 'TAMBAH_PASIEN', 'EDIT_PASIEN',
                              -- 'HAPUS_PASIEN', 'SIMPAN_REKAM_MEDIS',
                              -- 'TAMBAH_OBAT', 'EDIT_OBAT', 'CATAT_BAYAR',
                              -- 'TAMBAH_USER', 'EDIT_USER', 'NONAKTIF_USER'
  target_tabel TEXT,          -- misal: 'pasien', 'kunjungan', 'rekam_medis', 'obat'
  target_id UUID,             -- ID record yang diubah
  detail JSONB,               -- snapshot before/after atau info tambahan
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Index untuk query by user dan waktu
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_aksi ON activity_logs(aksi);
```

### Row Level Security (RLS) — Wajib Aktif

```sql
-- Aktifkan RLS semua tabel
ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekam_medis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE resep_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Attendance: user hanya bisa lihat miliknya sendiri, admin bisa lihat semua
CREATE POLICY "attendance_self" ON attendance_logs
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Activity log: hanya admin yang bisa baca (audit trail)
CREATE POLICY "activity_admin_only" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Activity log: semua role bisa INSERT (sistem yang insert, bukan user)
CREATE POLICY "activity_insert_all" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contoh policy: dokter hanya bisa update rekam_medis kunjungan yang di-assign ke mereka
CREATE POLICY "dokter_update_rm" ON rekam_medis
  FOR ALL USING (
    auth.uid() = dokter_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Staf bisa baca semua pasien & kunjungan, tapi tidak bisa edit rekam medis
CREATE POLICY "staf_read_pasien" ON pasien
  FOR SELECT USING (true); -- semua role bisa baca

CREATE POLICY "staf_insert_pasien" ON pasien
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staf', 'admin'))
  );
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | Framework utama |
| **Styling** | Tailwind CSS | UI cepat, responsive |
| **UI Components** | shadcn/ui | Komponen siap pakai |
| **Database** | PostgreSQL via Supabase | Region: **Singapore (ap-southeast-1)** |
| **Auth** | Supabase Auth | Built-in, role-based |
| **Realtime** | Supabase Realtime | Notifikasi dokter saat pasien masuk |
| **Hosting** | Vercel | Akun Gmail praktek Sudiman |
| **Repo** | GitHub `aziziega` (private) | Kamu sebagai developer |
| **AI Assist** | Claude Opus 4.6 via Antigravity | Untuk development |

---

## ⚙️ Supabase Region Singapore — Yang Perlu Diketahui

### Kenapa Singapore?
Region terdekat dengan Indonesia. Latency dari Klaten ke Singapore sekitar **20-40ms** — sangat acceptable untuk aplikasi web.

### Implikasi Hukum (UU PDP Indonesia)
Data rekam medis adalah **data kesehatan = data sensitif** berdasarkan UU No. 27 Tahun 2022 tentang PDP. Server di Singapore artinya data secara fisik di luar Indonesia. Risikonya:
- Untuk praktek skala kecil ini → **risiko rendah**, enforcement belum ketat di level ini
- Solusi jangka panjang (Phase 3): migrasi ke Supabase self-hosted di VPS Indonesia jika diperlukan

### Integrasi Satu Sehat dari Singapore — Apakah Susah?
**Tidak lebih susah.** Satu Sehat API berkomunikasi via HTTPS — tidak peduli server kamu di mana selama bisa hit endpoint `satusehat.kemkes.go.id`. Yang penting:
- Aplikasi kamu bisa akses internet (bisa)
- Kamu punya credentials Satu Sehat (organisasi ID, client ID, client secret)
- Data yang dikirim sesuai format FHIR R4 yang diminta Satu Sehat

**Kesimpulan:** Singapore aman, tidak ada blocker untuk Satu Sehat di kemudian hari.

---

## 💡 Satu Sehat — Kenapa Ini Nilai Jual ke Dokter

Maksudnya: ketika kamu presentasi sistem ini ke Dr. Sudiman yang skeptis, **jangan jual fitur teknis** — jual manfaat regulasi:

> *"Pak, mulai 2025 semua praktek dokter wajib punya Rekam Medis Elektronik dan terintegrasi Satu Sehat Kemenkes. Kalau tidak, ada sanksi. Sistem ini sudah kita siapkan agar nanti tinggal sambungkan saja — Bapak tidak perlu repot urus sendiri."*

Ini yang dimaksud "nilai jual" — compliance regulasi jadi alasan yang lebih kuat dari sekadar "biar lebih efisien."

---

## 📁 Struktur Project (Next.js App Router)

```
rme-sudiman/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Layout utama dengan sidebar & role check
│   │   ├── staf/
│   │   │   ├── pendaftaran/page.tsx    # Cari/daftar pasien + vital sign
│   │   │   └── antrian/page.tsx        # Lihat status antrian hari ini
│   │   ├── dokter/
│   │   │   ├── antrian/page.tsx        # Daftar pasien yang di-assign
│   │   │   └── periksa/[kunjunganId]/page.tsx  # Form rekam medis + resep
│   │   └── admin/
│   │       ├── pasien/page.tsx         # Manajemen data pasien
│   │       ├── obat/page.tsx           # Manajemen stok obat
│   │       ├── users/page.tsx          # Manajemen user/akun (tambah dokter/staf)
│   │       ├── attendance/page.tsx     # Rekap kehadiran staf & dokter
│   │       └── activity/page.tsx       # Audit trail semua aktivitas sistem
├── components/
│   ├── ui/                         # shadcn components
│   ├── pasien/
│   │   ├── FormPasienBaru.tsx
│   │   ├── CariPasien.tsx
│   │   └── KartuPasien.tsx
│   ├── kunjungan/
│   │   ├── FormVitalSign.tsx
│   │   ├── FormRekamMedis.tsx
│   │   └── FormResepObat.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── NotifRealtime.tsx       # Komponen notif Supabase Realtime
│       └── ActivityLogger.tsx      # Hook/util untuk log aktivitas otomatis
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase browser client
│   │   └── server.ts               # Supabase server client (SSR)
│   ├── icd10.ts                    # Helper search kode ICD-10
│   ├── activity-logger.ts          # Helper: log aktivitas ke tabel activity_logs
│   ├── attendance.ts               # Helper: clock-in/out otomatis via auth events
│   └── utils.ts
├── types/
│   └── database.ts                 # Generated types dari Supabase
└── middleware.ts                   # Auth middleware, redirect by role
```

---

## 📱 Halaman & Fitur Phase 1 (Detail)

### [STAF] Pendaftaran Pasien
- Search bar: cari by NRM, nama, atau tanggal lahir
- Jika ketemu: tampil nama, NRM, alergi obat, riwayat singkat
- Jika tidak ketemu: form pasien baru (generate NRM otomatis)
- Form vital sign: tensi (sistolik/diastolik), nadi, suhu, keluhan utama
- Dropdown assign dokter: Dokter 1 / Dokter 2
- Submit → notif realtime ke dokter yang dipilih

### [STAF] Antrian Hari Ini
- Tabel: nomor urut, nama pasien, NRM, assigned dokter, status (menunggu/diperiksa/selesai)
- Auto-refresh via Supabase Realtime

### [DOKTER] Antrian Masuk
- Notifikasi popup saat pasien baru di-assign
- List pasien hari ini yang di-assign ke dokter ini
- Badge status: menunggu / diperiksa / selesai
- Klik pasien → buka halaman periksa

### [DOKTER] Form Periksa
**Tab 1 — Rekam Medis:**
- Riwayat kunjungan sebelumnya (read-only, scrollable)
- Form: anamnesis, pemeriksaan fisik, diagnosis (search ICD-10), terapi, catatan

**Tab 2 — Resep & Obat:**
- Search obat dari master stok
- Input: dosis, jumlah → harga satuan auto-fill dari master
- Bisa tambah obat yang belum di master (input manual)
- Total obat otomatis terhitung

**Tab 3 — Pembayaran:**
- Tampil: tarif periksa (bisa edit), total obat (auto dari resep)
- Total bayar = tarif + obat
- Tombol "Tandai Lunas" → status kunjungan jadi SELESAI

### [ADMIN] Manajemen Stok Obat
- Tabel daftar obat: nama, satuan, stok, harga jual
- Tambah / edit / nonaktifkan obat
- Alert stok menipis (threshold bisa di-set)

### [ADMIN] Manajemen Pasien
- Search & lihat semua data pasien
- Edit data pasien (untuk koreksi)
- Input pasien lama (untuk migrasi bertahap)

### [ADMIN] Manajemen User
- Tambah akun baru: pilih role (staf/dokter), isi nama & email, sistem kirim invite
- Edit data user: nama, role, status aktif
- Nonaktifkan akun (bukan hapus — data historis tetap ada)
- Reset password via email

### [ADMIN] Attendance Logs
- Tabel rekap kehadiran per hari: nama, jam masuk, jam keluar, durasi, jumlah pasien ditangani
- Filter by: tanggal, bulan, user/role tertentu
- Rekap bulanan: total hari hadir per user
- **Jam masuk** = otomatis tercatat saat login pertama di hari itu
- **Jam keluar** = otomatis saat logout; jika tidak logout (tutup browser), dicatat saat session expired (24 jam)
- **Jumlah pasien ditangani** = untuk dokter: count kunjungan selesai yang di-assign ke mereka; untuk staf: count kunjungan yang didaftarkan hari itu

### [ADMIN] Activity Log (Audit Trail)
- Feed semua aktivitas penting di sistem, terbaru di atas
- Kolom: waktu, user, aksi, detail
- Aksi yang dicatat:

| Aksi | Contoh Detail |
|---|---|
| `LOGIN` | IP address, device |
| `TAMBAH_PASIEN` | Nama pasien, NRM baru |
| `EDIT_PASIEN` | Field yang diubah (before → after) |
| `HAPUS_PASIEN` | Nama pasien (soft delete) |
| `SIMPAN_REKAM_MEDIS` | Nama pasien, kunjungan ID |
| `EDIT_REKAM_MEDIS` | Kunjungan ID, field yang diubah |
| `CATAT_BAYAR` | Nama pasien, total bayar |
| `TAMBAH_OBAT` | Nama obat, stok awal |
| `EDIT_OBAT` | Nama obat, field yang diubah |
| `TAMBAH_USER` | Nama user baru, role |
| `EDIT_USER` | User yang diedit, perubahan role/status |
| `NONAKTIF_USER` | Nama user yang dinonaktifkan |

- Filter by: tanggal, user, jenis aksi
- Admin tidak bisa hapus activity log (immutable)

---

## 🕐 Attendance — Cara Kerja Otomatis

Clock-in/out tidak memerlukan tombol manual. Menggunakan **Supabase Auth event listener**:

```typescript
// lib/attendance.ts
import { createClient } from '@/lib/supabase/client'

export function initAttendanceTracking() {
  const supabase = createClient()

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Cek apakah sudah ada record hari ini
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('tanggal', today)
        .single()

      // Hanya insert jika belum ada (login pertama hari ini)
      if (!existing) {
        await supabase.from('attendance_logs').insert({
          user_id: session.user.id,
          tanggal: today,
          jam_masuk: new Date().toISOString(),
          ip_address: await getClientIP()
        })
      }
    }

    if (event === 'SIGNED_OUT' && session) {
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('attendance_logs')
        .update({ jam_keluar: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('tanggal', today)
        .is('jam_keluar', null)
    }
  })
}
```

```typescript
// lib/activity-logger.ts — dipanggil di setiap server action
export async function logActivity({
  userId,
  aksi,
  targetTabel,
  targetId,
  detail
}: ActivityLogParams) {
  const supabase = createClient()
  await supabase.from('activity_logs').insert({
    user_id: userId,
    aksi,
    target_tabel: targetTabel,
    target_id: targetId,
    detail, // JSONB: { before: {...}, after: {...} } atau info relevan
  })
}

// Contoh penggunaan di server action tambah pasien:
// await logActivity({ userId, aksi: 'TAMBAH_PASIEN', targetTabel: 'pasien', targetId: pasien.id, detail: { nama: pasien.nama, nrm: pasien.nrm } })
```

---

## 🔔 Realtime Notification — Cara Kerja

Menggunakan **Supabase Realtime** subscribe ke tabel `kunjungan`:

```typescript
// Di halaman dokter — NotifRealtime.tsx
const channel = supabase
  .channel('kunjungan-masuk')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'kunjungan',
      filter: `dokter_id=eq.${currentDokter.id}`
    },
    (payload) => {
      // Tampilkan notifikasi: "Pasien [nama] siap diperiksa"
      showNotification(payload.new)
    }
  )
  .subscribe()
```

---

## 🚀 Setup Awal — Urutan Langkah

### 1. Persiapan Akun
```
□ Buat Gmail baru: praktekdrsudiman@gmail.com (atau nama lain)
□ Daftar Supabase pakai Gmail praktek → pilih region Singapore
□ Daftar Vercel pakai Gmail praktek
□ Buat repo GitHub di aziziega → nama: rme-dr-sudiman → set Private
□ Connect Vercel ke GitHub aziziega (only select repository ini)
```

### 2. Setup Supabase
```
□ Buat project baru di Supabase
□ Jalankan semua SQL schema di atas via SQL Editor
□ Aktifkan RLS semua tabel
□ Buat policies RLS sesuai role
□ Enable Realtime untuk tabel kunjungan
□ Generate TypeScript types: npx supabase gen types typescript
□ Catat: SUPABASE_URL dan SUPABASE_ANON_KEY
```

### 3. Setup Project Next.js
```bash
npx create-next-app@latest rme-dr-sudiman --typescript --tailwind --app
cd rme-dr-sudiman
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr
```

### 4. Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # untuk admin operations
```

### 5. Deploy ke Vercel
```
□ Push repo ke GitHub
□ Di Vercel (akun Gmail praktek): Add New Project → Import dari GitHub aziziega
□ Set environment variables di Vercel dashboard
□ Deploy
```

---

## 📦 Data ICD-10

Untuk search diagnosis, gunakan dataset ICD-10 publik. Rekomendasi:
- Download dari: https://icd.who.int/browse10
- Atau pakai npm package: `icd10-cm` (versi US, tapi strukturnya sama)
- Simpan di PostgreSQL tabel `icd10` untuk search server-side
- Minimal untuk Phase 1: sediakan ~100 kode yang paling umum di praktek umum (ISPA, hipertensi, diabetes, dll)

---

## ⚠️ Catatan Penting & Risiko

| Risiko | Mitigasi |
|---|---|
| Dr. Sudiman tidak mau pakai | Staf depan yang input semua, dokter tidak wajib buka sistem |
| Internet mati saat praktek | Sediakan hotspot HP sebagai backup; catat di kertas dulu, input setelah online |
| Data pasien lama tidak ada di sistem | Saat pasien lama datang, staf input data dasar saat itu juga (registrasi on-demand) |
| Staf tidak familiar komputer | UI harus sangat simpel; sediakan sesi training 1-2 jam sebelum go-live |
| Stok obat tidak sinkron | Lakukan stock opname fisik sebelum go-live, input semua ke master obat |

---

## 🗓️ Estimasi Timeline Phase 1

| Minggu | Target |
|---|---|
| **Minggu 1** | Setup akun, Supabase schema, auth & middleware |
| **Minggu 2** | Halaman staf: pendaftaran, cari pasien, vital sign |
| **Minggu 3** | Halaman dokter: antrian, form rekam medis, realtime notif |
| **Minggu 4** | Resep obat, pembayaran, manajemen stok |
| **Minggu 5** | Admin panel: manajemen user, pasien, stok obat |
| **Minggu 6** | Attendance logs + activity log / audit trail |
| **Minggu 7** | Testing menyeluruh, bug fix, training staf, go-live |

---

## 🔮 Phase 2 (Setelah Phase 1 Stabil)

- Antrian digital dengan display nomor
- Dashboard laporan: pendapatan harian, pasien per hari, diagnosis terbanyak
- Export rekam medis ke PDF
- **Integrasi Satu Sehat** (FHIR R4 API)
- Notifikasi WhatsApp (Fonnte/WA Gateway)
- Migrasi data pasien lama massal

---

*Dokumen ini dibuat sebagai panduan implementasi untuk Claude Code (Antigravity) dengan model claude-opus-4-6. Update sesuai kebutuhan saat development berlangsung.*
