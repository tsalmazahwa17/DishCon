# DishCon — Production & Presentation Build

DishCon adalah platform donasi makanan berbasis **Next.js App Router**, **Tailwind CSS**, komponen UI berbasis Shadcn/Radix, **Supabase**, dan **Node.js Route Handler**. Build ini mendukung alur presentasi end-to-end: donatur mengunggah makanan, AI menilai nutrisi dan risiko kedaluwarsa, admin memverifikasi, penerima mengajukan pengambilan mandiri, lalu admin memperbarui status penyaluran.

## Revisi utama pada paket ini

- Pengajuan penerima hanya menggunakan **pengambilan mandiri**. Opsi pengantaran/kurir telah dihapus dari UI, tipe data, dan constraint Supabase.
- Menu **Preferensi** di sidebar penerima dihapus dan seluruh pengaturannya dipindahkan ke halaman **Settings**.
- Pusat pengaduan dapat dibuka detailnya oleh Donatur, Penerima, dan Admin.
- Admin dapat mengubah status pengaduan menjadi `open`, `in_review`, atau `resolved`.
- Pengaduan dapat otomatis diteruskan ke email pengelola setelah environment email diisi.
- Footer dibuat gelap seperti referensi visual, hanya menampilkan **Email** dan **Telepon**, dengan label dan direct link yang dapat diubah melalui `.env.local`.
- Tombol **Continue with Google** telah diaktifkan pada halaman registrasi untuk Supabase Google OAuth.
- Login Admin dipisahkan pada route `/admin/login` dan hanya menerima akun dengan role `admin` di tabel `profiles`.
- Email admin dapat ditentukan melalui tabel `admin_email_allowlist` sebelum akun dibuat.
- Kotak **Lokasi di Peta** pada sidebar katalog penerima telah dihapus. Tombol navigasi tetap tersedia pada setiap kartu makanan.
- Schema Supabase meliputi profil, donasi, pengajuan, notifikasi, preferensi, pengaduan, email status, role admin, serta Storage assets.
- OpenRouter tetap terhubung melalui endpoint `/api/ai-assessment` dengan fallback local food-safety rules saat API key belum tersedia.

## Tech stack

- **Frontend & Routing:** React 18, Next.js 14 App Router
- **Styling:** Tailwind CSS dan komponen berbasis Radix/Shadcn pattern
- **Backend:** Next.js Route Handlers dengan runtime Node.js
- **Database & Auth:** Supabase PostgreSQL dan Supabase Auth
- **Storage:** Supabase Storage bucket `donation-images` dan `profile-assets`
- **AI:** OpenRouter melalui environment `OPENROUTER_API_KEY` dan `OPENROUTER_MODEL`
- **Email Pengaduan:** Resend API melalui server route

## Menjalankan aplikasi

```bash
npm install --legacy-peer-deps --no-audit --no-fund
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

## Mode demo lokal

Aplikasi tetap dapat berjalan tanpa Supabase. Data disimpan pada browser yang sama.

Login Admin demo:

```text
URL: http://localhost:3000/admin/login
Email: admin@dishcon.id
Password: Admin123!
```

## Menghubungkan Supabase

Panduan lengkap tersedia di:

```text
SETUP_SUPABASE_OPENROUTER_EMAIL.md
```

Langkah inti:

1. Buat project Supabase.
2. Jalankan seluruh isi `supabase/schema.sql` di SQL Editor.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi URL dan anon key Supabase.
5. Aktifkan provider Google dan masukkan callback URL `/auth/callback`.
6. Restart server.

## Menentukan Admin berdasarkan email

Sebelum akun admin dibuat, masukkan email ke allowlist:

```sql
insert into public.admin_email_allowlist(email)
values ('admin@domain.com')
on conflict do nothing;
```

Setelah email tersebut mendaftar atau login melalui Supabase Auth, trigger akan membuat profil dengan role `admin`.

Untuk akun yang sudah terlanjur dibuat:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('admin@domain.com');
```

Gunakan login khusus:

```text
/admin/login
```

## Route utama

### Donatur

- `/donor/dashboard`
- `/donor/donate`
- `/donor/history`
- `/donor/profile`
- `/donor/notifications`
- `/donor/complaint`
- `/donor/settings`

### Penerima

- `/recipient/dashboard`
- `/recipient/catalog`
- `/recipient/request`
- `/recipient/history`
- `/recipient/profile`
- `/recipient/notifications`
- `/recipient/complaint`
- `/recipient/settings` — termasuk preferensi

### Admin

- `/admin/login`
- `/admin/dashboard`
- `/admin/donations`
- `/admin/requests`
- `/admin/users`
- `/admin/ai-settings`
- `/admin/zones`
- `/admin/complaints`
- `/admin/notifications`
- `/admin/settings`

## Validasi teknis

```bash
npx tsc --noEmit
npm run lint
npm run build
```
