import design from "@/assets/design.jpg";
import video from "@/assets/video.jpg";
import docs from "@/assets/docs.jpg";
import hero from "@/assets/hero.jpg";

/** DATA LAYANAN — semua harga & estimasi di bawah adalah CONTOH. Ganti sesuai ketentuan Anda. */
export const categories = [
  "Desain Poster",
  "Desain Grafis",
  "Editing Video",
  "Film Pendek",
  "Dokumen & Makalah",
  "Administrasi Keuangan",
] as const;
export type Category = (typeof categories)[number];

export type Package = { name: string; price: number; features: string[] };
export type Service = {
  slug: string;
  name: string;
  category: Category;
  image: string;
  gallery: string[];
  short: string;
  description: string;
  benefits: string[];
  deliverables: string[];
  packages: Package[];
  duration: string;
  revisions: string;
  requirements: string[];
  available: boolean;
  featured?: boolean;
};

export const services: Service[] = [
  {
    slug: "desain-poster-acara",
    name: "Desain Poster Acara",
    category: "Desain Poster",
    image: design,
    gallery: [design, hero],
    short: "Poster acara, seminar, dan lomba yang jelas dan menarik perhatian.",
    description:
      "Poster dirancang dengan hierarki informasi yang jelas sehingga judul, tanggal, dan cara mendaftar mudah ditangkap dalam sekali lihat. Cocok untuk cetak maupun media sosial.",
    benefits: ["Informasi mudah dibaca", "Siap cetak dan siap unggah", "Sesuai identitas acara"],
    deliverables: ["File PNG/JPG resolusi tinggi", "File PDF siap cetak", "Versi feed Instagram"],
    packages: [
      { name: "Basic", price: 35000, features: ["1 desain", "1x revisi", "Format feed"] },
      { name: "Standar", price: 60000, features: ["1 desain", "3x revisi", "Feed + cetak A3"] },
      { name: "Lengkap", price: 95000, features: ["1 desain + 2 turunan", "5x revisi", "Semua format"] },
    ],
    duration: "1–3 hari kerja",
    revisions: "Sesuai paket",
    requirements: ["Teks isi poster", "Logo penyelenggara", "Referensi gaya (opsional)"],
    available: true,
    featured: true,
  },
  {
    slug: "desain-feed-media-sosial",
    name: "Desain Feed Media Sosial",
    category: "Desain Grafis",
    image: hero,
    gallery: [hero, design],
    short: "Konten feed yang konsisten untuk UMKM dan organisasi.",
    description:
      "Set desain feed dengan gaya visual seragam agar akun terlihat profesional. Kami bantu menyusun template yang dapat dipakai ulang.",
    benefits: ["Tampilan akun lebih konsisten", "Template dapat dipakai ulang", "Hemat waktu produksi konten"],
    deliverables: ["File desain per slide", "Template sumber (Canva) bila diminta"],
    packages: [
      { name: "5 Slide", price: 75000, features: ["5 desain", "2x revisi"] },
      { name: "10 Slide", price: 140000, features: ["10 desain", "3x revisi", "Template Canva"] },
    ],
    duration: "2–4 hari kerja",
    revisions: "Sesuai paket",
    requirements: ["Materi konten", "Logo & warna brand"],
    available: true,
    featured: true,
  },
  {
    slug: "editing-video-acara",
    name: "Editing Video Acara",
    category: "Editing Video",
    image: video,
    gallery: [video],
    short: "Rangkuman video kegiatan, reels, dan dokumentasi acara.",
    description:
      "Mengolah rekaman mentah menjadi video yang enak ditonton: pemotongan, musik, teks, dan koreksi warna dasar.",
    benefits: ["Alur cerita runtut", "Musik & teks rapi", "Format sesuai platform"],
    deliverables: ["Video MP4 1080p", "Versi vertikal untuk Reels/TikTok bila dipilih"],
    packages: [
      { name: "Reels ≤ 1 menit", price: 80000, features: ["Format vertikal", "2x revisi"] },
      { name: "Aftermovie ≤ 5 menit", price: 200000, features: ["Format horizontal", "3x revisi"] },
    ],
    duration: "3–5 hari kerja",
    revisions: "Sesuai paket",
    requirements: ["Rekaman mentah", "Musik/referensi (opsional)", "Logo"],
    available: true,
    featured: true,
  },
  {
    slug: "film-pendek-tugas",
    name: "Pendampingan Film Pendek",
    category: "Film Pendek",
    image: video,
    gallery: [video],
    short: "Bantuan naskah, storyboard, dan editing film pendek.",
    description:
      "Pendampingan produksi film pendek untuk tugas atau lomba, mulai dari penyusunan naskah, storyboard, hingga penyuntingan akhir.",
    benefits: ["Proses produksi lebih terarah", "Hasil akhir siap tayang"],
    deliverables: ["Naskah & storyboard", "Video final MP4"],
    packages: [{ name: "Paket Produksi", price: 450000, features: ["Naskah", "Storyboard", "Editing final"] }],
    duration: "7–14 hari kerja",
    revisions: "2x revisi editing",
    requirements: ["Tema/ide cerita", "Durasi target", "Rekaman (bila sudah ada)"],
    available: false,
  },
  {
    slug: "perapian-makalah",
    name: "Perapian Format Makalah",
    category: "Dokumen & Makalah",
    image: docs,
    gallery: [docs],
    short: "Merapikan format, daftar isi, dan sitasi dokumen Anda.",
    description:
      "Kami merapikan tata letak dokumen yang sudah Anda tulis: margin, heading, daftar isi otomatis, penomoran, dan format daftar pustaka. Isi tulisan tetap milik dan tanggung jawab Anda.",
    benefits: ["Dokumen sesuai pedoman", "Daftar isi otomatis", "Tampilan profesional"],
    deliverables: ["File DOCX rapi", "File PDF"],
    packages: [
      { name: "≤ 20 halaman", price: 40000, features: ["Format lengkap", "1x revisi"] },
      { name: "≤ 50 halaman", price: 85000, features: ["Format lengkap", "2x revisi"] },
    ],
    duration: "1–2 hari kerja",
    revisions: "Sesuai paket",
    requirements: ["File dokumen", "Pedoman format dari instansi"],
    available: true,
    featured: true,
  },
  {
    slug: "pembukuan-sederhana",
    name: "Pembukuan Sederhana UMKM",
    category: "Administrasi Keuangan",
    image: docs,
    gallery: [docs],
    short: "Template dan rekap kas harian atau bulanan di spreadsheet.",
    description:
      "Membantu menyusun pencatatan keuangan sederhana: kas masuk-keluar, rekap bulanan, dan grafik ringkas di Excel/Google Sheets.",
    benefits: ["Arus kas lebih terpantau", "Template dapat dipakai terus"],
    deliverables: ["File spreadsheet", "Panduan singkat penggunaan"],
    packages: [
      { name: "Template", price: 50000, features: ["Template kas", "Panduan"] },
      { name: "Template + Input", price: 120000, features: ["Input data 1 bulan", "Rekap & grafik"] },
    ],
    duration: "2–3 hari kerja",
    revisions: "2x revisi",
    requirements: ["Contoh data transaksi", "Kebutuhan laporan"],
    available: true,
  },
];

export const startingPrice = (s: Service) => Math.min(...s.packages.map((p) => p.price));
export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
