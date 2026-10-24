import design from "@/assets/design.jpg";
import video from "@/assets/video.jpg";
import docs from "@/assets/docs.jpg";
import hero from "@/assets/hero.jpg";
import type { Category } from "./services";

/** PORTOFOLIO — item di bawah adalah CONTOH placeholder. Ganti dengan karya asli Anda. */
export type PortfolioItem = { id: string; title: string; category: Category; image: string; description: string; date?: string };

export const portfolio: PortfolioItem[] = [
  { id: "p1", title: "Contoh: Poster Seminar", category: "Desain Poster", image: design, description: "Contoh placeholder poster seminar dengan tipografi tegas." },
  { id: "p2", title: "Contoh: Identitas Visual Komunitas", category: "Desain Grafis", image: hero, description: "Contoh placeholder materi visual untuk komunitas." },
  { id: "p3", title: "Contoh: Aftermovie Kegiatan", category: "Editing Video", image: video, description: "Contoh placeholder rangkuman video kegiatan." },
  { id: "p4", title: "Contoh: Film Pendek Tugas", category: "Film Pendek", image: video, description: "Contoh placeholder film pendek bertema keluarga." },
  { id: "p5", title: "Contoh: Perapian Laporan", category: "Dokumen & Makalah", image: docs, description: "Contoh placeholder laporan yang dirapikan formatnya." },
  { id: "p6", title: "Contoh: Rekap Kas UMKM", category: "Administrasi Keuangan", image: docs, description: "Contoh placeholder template kas bulanan." },
];

export const faqs = [
  { q: "Bagaimana cara memesan?", a: "Isi formulir di halaman Pesan. Ringkasan pesanan akan dikirim ke WhatsApp kami, lalu admin mengonfirmasi detail dan harga." },
  { q: "Apakah pesanan langsung tersimpan setelah formulir dikirim?", a: "Belum. Formulir menyusun pesan WhatsApp. Pesanan dianggap masuk setelah Anda mengirim pesan tersebut dan admin membalas." },
  { q: "Kapan pembayaran dilakukan?", a: "Setelah detail pesanan disepakati. Informasi pembayaran dikirim langsung oleh admin." },
  { q: "Berapa kali saya bisa revisi?", a: "Jumlah revisi mengikuti paket yang dipilih dan tercantum di halaman detail layanan." },
];
