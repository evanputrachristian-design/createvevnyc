# Pengembangan createvevnyc bertahap

## Hasil audit
- Website, login admin, katalog dari database, unggahan foto, dan penyimpanan pesanan sudah tersedia.
- Terdapat 6 layanan, 1 pesanan, dan 1 akun berperan admin. Semua dipertahankan.
- Pembayaran, editor website, pelacakan pelanggan, serta riwayat aktivitas belum tersedia.
- Akun Midtrans sudah dimiliki pengguna, tetapi kredensial belum tersimpan di proyek. Email dan WhatsApp otomatis belum terkonfigurasi.
- Kode katalog dan foto memerlukan pengaturan server URL dan kunci publik. Keberadaannya terdeteksi di lingkungan pengembangan; ketersediaan pada produksi belum diverifikasi. Jangan menyatakan penyebab produksi pasti hanya dari kode.

## Urutan pengerjaan hemat kredit
### 1. Pengaturan pembayaran dan pesanan
- Tambah persentase DP 0–100%, kewajiban DP, metode cash/transfer/QRIS, rekening, instruksi, kontak konfirmasi, dan ketentuan pelunasan.
- Formulir hanya menawarkan metode aktif. Validasi layanan/paket di server, simpan harga awal dan salinan ketentuan saat pemesanan; harga final tetap “Menunggu konfirmasi harga” sampai admin menyepakati.
- Pertahankan pesanan lama tanpa mengarang harga atau pembayaran yang belum diketahui.
- Perhitungan memakai integer Rupiah dan pembulatan DP; uang diterima hanya dari pembayaran terkonfirmasi.

### 2. Admin pesanan, pembayaran, dan dasbor
- Detail pesanan untuk konfirmasi harga, persentase DP, status pekerjaan terpisah, transaksi cash/transfer, serta koreksi beralasan.
- Konfirmasi manual mencatat admin, waktu, nominal, metode, dan catatan. Cegah pembayaran berlebih dan transaksi ganda secara atomik.
- Pencarian, filter, halaman daftar, riwayat aktivitas, ringkasan tanggal, omzet, DP diterima, uang diterima, dan sisa tagihan.
- Tambah navigasi Pembayaran, Editor Website, Pengaturan, dan Riwayat Aktivitas tanpa mengubah desain publik.

### 3. Editor website dan layanan
- Konten brand/logo, beranda, tombol/tautan, gambar, tentang, FAQ, testimoni asli, footer, WhatsApp/email/Instagram/TikTok/YouTube benar-benar digunakan halaman publik.
- Simpan draft, batal, pratinjau, dan publikasikan konten. Jangan menciptakan kontak atau testimoni baru.
- Tingkatkan editor layanan: paket/harga/fitur, estimasi, urutan, aktif/nonaktif, dan pengarsipan aman agar riwayat pesanan tetap utuh.

### 4. Pelacakan pelanggan
- Kode acak rahasia dibuat server; bukan UUID pesanan sebagai satu-satunya akses.
- Halaman menampilkan status pekerjaan/pembayaran, DP, uang diterima, saldo, serta instruksi; tanpa data pribadi dan catatan internal.
- Batasi percobaan dengan pencatatan terpusat di database, bukan memori server. Jangan memberikan akses baca publik ke tabel pesanan/pembayaran.

### 5. Midtrans dan notifikasi
- Gunakan Midtrans Sandbox QRIS melalui API resmi yang kompatibel dengan server saat ini; jangan mengganti ke penyedia lain.
- Minta Sandbox Server Key lewat formulir rahasia, bukan chat. Aktifkan hanya setelah verifikasi akun/metode dan pengujian nyata.
- Notifikasi memverifikasi signature SHA-512, ID, nominal, dan status melalui API Midtrans; pemrosesan idempoten. Settlement QRIS dihitung sebagai diterima; pending/gagal/expire/cancel tidak.
- Refund hanya ditampilkan sebagai diterapkan setelah pencatatan pengembalian dana benar-benar tersedia dan diuji.
- Sediakan modul/template email dan WhatsApp dengan status integrasi yang jujur; pengiriman otomatis menunggu penyedia/domain yang siap.

## Detail teknis
- Pertahankan TanStack Start, React, TypeScript, Vite, deployment Cloudflare, serta integrasi Lovable Cloud yang ada.
- Migrasi aditif untuk pengaturan, snapshot pesanan, transaksi pembayaran, versi konten, dan aktivitas. Sertakan GRANT, RLS, dan otorisasi admin untuk perubahan sensitif.
- Gunakan server functions untuk operasi internal dan server route publik terverifikasi untuk callback Midtrans. Kredensial hanya dibaca dalam batas eksekusi server.
- Perubahan nominal/transaksi menggunakan penguncian pesanan dan fungsi database untuk menjaga konsistensi saat permintaan bersamaan.
- Periksa konfigurasi server tanpa mengedit berkas integrasi otomatis atau mengarang binding Cloudflare.
- Perbarui catatan arsitektur yang sudah tidak sesuai: pesanan kini disimpan, bukan frontend-only.

## Pengujian dan batas penyelesaian
- Jalankan tes validasi DP, pembulatan, saldo, status gagal, snapshot lama, otorisasi, duplikat, dan batas pembayaran; pengujian alur admin masuk, pemesanan, pencatatan manual, editor publik, dan pelacakan.
- Periksa hasil pemeriksaan otomatis dan kesalahan tampilan; dokumentasikan migrasi, pengaturan, dan langkah pengujian.
- Pengujian Midtrans nyata dan email otomatis menunggu kredensial/penyedia. Jangan mengklaim fitur tersebut aktif sebelum diuji.
- Jangan deploy tanpa permintaan pengguna. Kerjakan sesuai urutan, gabungkan perubahan terkait, dan hindari perubahan kosmetik yang tidak diperlukan.