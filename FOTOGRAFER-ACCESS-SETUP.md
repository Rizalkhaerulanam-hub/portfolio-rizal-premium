# Portfolio Rizal — Sistem Izin Proyek Fotografer

Perubahan:
- Project 06 "Fotografer" sekarang menuju `fotografer.html`.
- Pengunjung dapat membuat akun, login, dan mengajukan salah satu role: FEMALE, MALE, PUBLIC.
- Role yang disetujui tersimpan pada akun dan tidak dapat diganti oleh pengunjung.
- Admin mempunyai halaman `admin.html` untuk menerima/menolak permintaan.
- `supabase-schema.sql` berisi struktur database + RLS.

## Penting
GitHub Pages/HTML saja tidak cukup untuk keamanan akses. File foto privat jangan memakai URL Cloudinary publik.
Gunakan Cloudinary authenticated/private assets dan signed URL yang dibuat server-side/Edge Function.

## Setup
1. Buat project Supabase.
2. Jalankan `supabase-schema.sql` di SQL Editor.
3. Buat akun admin melalui Supabase Auth.
4. Ambil UUID akun admin dan set `is_admin=true` menggunakan SQL pada bagian akhir file schema.
5. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di:
   - `js/photographer.js`
   - `js/admin.js`
6. Tambahkan metadata foto ke tabel `photos`.
7. Untuk produksi, ganti `display_url` menjadi signed URL sementara yang dibuat server-side/Edge Function untuk aset Cloudinary authenticated/private.
