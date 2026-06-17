# DishCon / DishConnect

DishCon adalah website donasi makanan berbasis lokasi dan AI. Donatur mengunggah makanan, sistem membantu cek nutrisi dan risiko kedaluwarsa, lalu penerima mengajukan pengambilan makanan secara mandiri.

## Alur aplikasi

1. **Donatur daftar akun** sebagai donatur, lalu verifikasi email.
2. **Donatur login** dan mengisi form donasi makanan.
3. Saat form donasi diisi, donatur dapat menjalankan **AI Nutrition** dan **Expiry Risk**.
4. Hasil AI tersimpan bersama data donasi di Supabase.
5. **Admin memverifikasi donasi** dari halaman admin.
6. Setelah aktif, makanan muncul di katalog penerima.
7. **Penerima mengajukan jumlah porsi** yang dibutuhkan.
8. Admin menyetujui atau menolak pengajuan.
9. Jika disetujui, stok porsi makanan berkurang sesuai jumlah pengajuan.
10. Penerima mengambil makanan sendiri di lokasi donatur.

## Cara menjalankan project

Pastikan Node.js sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Buka website di:

```text
http://localhost:3000
```

## File environment

Buat file `.env.local` di folder utama project, sejajar dengan `package.json`.

Contoh isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-kamu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key-supabase-kamu

OPENROUTER_API_KEY=api-key-openrouter-kamu
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
NEXT_PUBLIC_SITE_URL=http://localhost:3000

RESEND_API_KEY=
COMPLAINT_EMAIL_FROM=DishCon <onboarding@resend.dev>
COMPLAINT_EMAIL_TO=emailtujuanpengaduan@gmail.com
```

Keterangan:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dipakai untuk database, login, register, dan upload foto.
- `OPENROUTER_API_KEY` dipakai untuk fitur AI Nutrition dan Expiry Risk.
- `RESEND_API_KEY` hanya diperlukan jika pusat pengaduan ingin otomatis masuk ke email admin.

## Setup Supabase

1. Buka project Supabase.
2. Masuk ke **SQL Editor**.
3. Copy isi file `supabase/schema.sql`.
4. Jalankan query tersebut.
5. Aktifkan **Email Auth** dan **Google OAuth** jika ingin memakai tombol Continue with Google.

## Verifikasi email

Akun yang baru dibuat harus verifikasi email terlebih dahulu. Jika email belum diverifikasi, user tidak dapat login.

Jika project Supabase kamu otomatis menganggap email sudah terverifikasi, user akan langsung bisa login setelah register. Jika Supabase mengirim email konfirmasi, user harus klik link verifikasi dulu.


## Settings dan keamanan akun

Halaman Settings tersedia untuk donatur, penerima, dan admin. Dari halaman ini user dapat membuka profil dan mengubah password akun. Penerima juga dapat mengatur preferensi makanan dan jarak maksimal.

Verifikasi email tidak ditaruh di Settings, karena alurnya berjalan saat registrasi melalui Supabase Auth. Jika email belum diverifikasi, akun tidak bisa login.

## Akun admin

Admin tidak dibuat dari halaman register publik. Untuk menjadikan email tertentu sebagai admin, jalankan query berikut di Supabase SQL Editor:

```sql
insert into public.admin_email_allowlist(email)
values ('emailadmin@domain.com')
on conflict do nothing;
```

Jika akun sudah terlanjur dibuat, ubah role-nya:

```sql
update public.profiles
set role = 'admin'
where email = 'emailadmin@domain.com';
```

## Catatan penting

- Jangan memasukkan API key langsung ke kode.
- Masukkan API key hanya ke `.env.local`.
- Folder `node_modules` tidak ikut disimpan di ZIP. Jalankan `npm install` setelah extract.
- Filter jarak memakai pembacaan alamat teks, bukan koordinat. Karena tidak memakai koordinat, hasilnya berupa estimasi area/kota, bukan jarak GPS presisi.
