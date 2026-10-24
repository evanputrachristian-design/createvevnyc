create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  short text not null default '',
  description text not null default '',
  price integer not null default 0,
  duration text not null default '',
  image_key text,
  photo_path text,
  available boolean not null default true,
  featured boolean not null default false,
  extras jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Public can read available services" on public.services for select to anon using (available = true);
create policy "Admins can read all services" on public.services for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert services" on public.services for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update services" on public.services for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete services" on public.services for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  contact text not null,
  service_name text not null,
  pkg text not null,
  quantity text,
  description text not null,
  reference text,
  deadline text,
  notes text,
  status text not null default 'baru'
);
grant insert on public.orders to anon;
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Anyone can place an order" on public.orders for insert to anon, authenticated with check (true);
create policy "Admins can read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can read service photos" on storage.objects for select to anon using (bucket_id = 'service-photos');
create policy "Admins can upload service photos" on storage.objects for insert to authenticated with check (bucket_id = 'service-photos' and public.has_role(auth.uid(), 'admin'));
create policy "Admins can update service photos" on storage.objects for update to authenticated using (bucket_id = 'service-photos' and public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete service photos" on storage.objects for delete to authenticated using (bucket_id = 'service-photos' and public.has_role(auth.uid(), 'admin'));

insert into public.services (slug, name, category, short, description, price, duration, image_key, available, featured, sort_order, extras) values
('desain-poster-acara','Desain Poster Acara','Desain Poster','Poster acara, seminar, dan lomba yang jelas dan menarik perhatian.','Poster dirancang dengan hierarki informasi yang jelas sehingga judul, tanggal, dan cara mendaftar mudah ditangkap dalam sekali lihat. Cocok untuk cetak maupun media sosial.',35000,'1–3 hari kerja','design',true,true,1,'{"benefits":["Informasi mudah dibaca","Siap cetak dan siap unggah","Sesuai identitas acara"],"deliverables":["File PNG/JPG resolusi tinggi","File PDF siap cetak","Versi feed Instagram"],"packages":[{"name":"Basic","price":35000,"features":["1 desain","1x revisi","Format feed"]},{"name":"Standar","price":60000,"features":["1 desain","3x revisi","Feed + cetak A3"]},{"name":"Lengkap","price":95000,"features":["1 desain + 2 turunan","5x revisi","Semua format"]}],"revisions":"Sesuai paket","requirements":["Teks isi poster","Logo penyelenggara","Referensi gaya (opsional)"],"gallery":["design","hero"]}'),
('desain-feed-media-sosial','Desain Feed Media Sosial','Desain Grafis','Konten feed yang konsisten untuk UMKM dan organisasi.','Set desain feed dengan gaya visual seragam agar akun terlihat profesional. Kami bantu menyusun template yang dapat dipakai ulang.',75000,'2–4 hari kerja','hero',true,true,2,'{"benefits":["Tampilan akun lebih konsisten","Template dapat dipakai ulang","Hemat waktu produksi konten"],"deliverables":["File desain per slide","Template sumber (Canva) bila diminta"],"packages":[{"name":"5 Slide","price":75000,"features":["5 desain","2x revisi"]},{"name":"10 Slide","price":140000,"features":["10 desain","3x revisi","Template Canva"]}],"revisions":"Sesuai paket","requirements":["Materi konten","Logo & warna brand"],"gallery":["hero","design"]}'),
('editing-video-acara','Editing Video Acara','Editing Video','Rangkuman video kegiatan, reels, dan dokumentasi acara.','Mengolah rekaman mentah menjadi video yang enak ditonton: pemotongan, musik, teks, dan koreksi warna dasar.',80000,'3–5 hari kerja','video',true,true,3,'{"benefits":["Alur cerita runtut","Musik & teks rapi","Format sesuai platform"],"deliverables":["Video MP4 1080p","Versi vertikal untuk Reels/TikTok bila dipilih"],"packages":[{"name":"Reels ≤ 1 menit","price":80000,"features":["Format vertikal","2x revisi"]},{"name":"Aftermovie ≤ 5 menit","price":200000,"features":["Format horizontal","3x revisi"]}],"revisions":"Sesuai paket","requirements":["Rekaman mentah","Musik/referensi (opsional)","Logo"],"gallery":["video"]}'),
('film-pendek-tugas','Pendampingan Film Pendek','Film Pendek','Bantuan naskah, storyboard, dan editing film pendek.','Pendampingan produksi film pendek untuk tugas atau lomba, mulai dari penyusunan naskah, storyboard, hingga penyuntingan akhir.',450000,'7–14 hari kerja','video',false,false,4,'{"benefits":["Proses produksi lebih terarah","Hasil akhir siap tayang"],"deliverables":["Naskah & storyboard","Video final MP4"],"packages":[{"name":"Paket Produksi","price":450000,"features":["Naskah","Storyboard","Editing final"]}],"revisions":"2x revisi editing","requirements":["Tema/ide cerita","Durasi target","Rekaman (bila sudah ada)"],"gallery":["video"]}'),
('perapian-makalah','Perapian Format Makalah','Dokumen & Makalah','Merapikan format, daftar isi, dan sitasi dokumen Anda.','Kami merapikan tata letak dokumen yang sudah Anda tulis: margin, heading, daftar isi otomatis, penomoran, dan format daftar pustaka. Isi tulisan tetap milik dan tanggung jawab Anda.',40000,'1–2 hari kerja','docs',true,true,5,'{"benefits":["Dokumen sesuai pedoman","Daftar isi otomatis","Tampilan profesional"],"deliverables":["File DOCX rapi","File PDF"],"packages":[{"name":"≤ 20 halaman","price":40000,"features":["Format lengkap","1x revisi"]},{"name":"≤ 50 halaman","price":85000,"features":["Format lengkap","2x revisi"]}],"revisions":"Sesuai paket","requirements":["File dokumen","Pedoman format dari instansi"],"gallery":["docs"]}'),
('pembukuan-sederhana','Pembukuan Sederhana UMKM','Administrasi Keuangan','Template dan rekap kas harian atau bulanan di spreadsheet.','Membantu menyusun pencatatan keuangan sederhana: kas masuk-keluar, rekap bulanan, dan grafik ringkas di Excel/Google Sheets.',50000,'2–3 hari kerja','docs',true,false,6,'{"benefits":["Arus kas lebih terpantau","Template dapat dipakai terus"],"deliverables":["File spreadsheet","Panduan singkat penggunaan"],"packages":[{"name":"Template","price":50000,"features":["Template kas","Panduan"]},{"name":"Template + Input","price":120000,"features":["Input data 1 bulan","Rekap & grafik"]}],"revisions":"2x revisi","requirements":["Contoh data transaksi","Kebutuhan laporan"],"gallery":["docs"]}');