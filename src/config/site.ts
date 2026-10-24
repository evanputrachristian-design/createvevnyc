/**
 * PUSAT PENGATURAN IDENTITAS WEBSITE
 * Ganti semua nilai di bawah ini dengan data bisnis Anda yang sebenarnya.
 * Semua halaman membaca data dari file ini, jadi cukup edit di satu tempat.
 */
export const site = {
  brandName: "Karya Rapi",
  ownerName: "Nama Pengelola",
  logoText: "KR", // dipakai sebagai logo teks; ganti dengan logoUrl bila punya logo gambar
  logoUrl: "" as string, // contoh: "/logo.png" (simpan file di folder public)
  favicon: "/favicon.ico",
  tagline: "Jasa kreatif & administrasi digital yang rapi, tepat waktu, dan mudah dipesan.",
  description:
    "Kami membantu pelajar, mahasiswa, komunitas, organisasi, UMKM, dan masyarakat umum menyelesaikan kebutuhan desain, video, dokumen, dan administrasi sederhana.",
  // Warna utama diatur di src/styles.css (variabel --primary dan --accent).

  // Nomor WhatsApp format internasional tanpa tanda + atau spasi. CONTOH, ganti!
  whatsapp: "6281234567890",
  email: "halo@contoh-bisnis.id",
  serviceArea: "Melayani secara online ke seluruh Indonesia",
  socials: [
    { label: "Instagram", url: "https://instagram.com/" },
    { label: "TikTok", url: "https://tiktok.com/" },
    { label: "YouTube", url: "https://youtube.com/" },
  ],
  operatingHours: [
    { day: "Senin – Jumat", hours: "09.00 – 20.00 WIB" },
    { day: "Sabtu", hours: "09.00 – 15.00 WIB" },
    { day: "Minggu & libur nasional", hours: "Tutup" },
  ],
  payment: {
    note: "Pembayaran dilakukan setelah detail pesanan disepakati melalui WhatsApp. Rincian rekening atau e-wallet dikirimkan langsung oleh admin.",
    methods: ["Transfer bank", "E-wallet", "QRIS"],
  },
  policies: [
    "Pengerjaan dimulai setelah brief lengkap dan pembayaran awal diterima.",
    "Jumlah revisi mengikuti paket yang dipilih.",
    "File hasil dikirim dalam format digital melalui WhatsApp, email, atau tautan unduhan.",
    "Kami tidak menerima pengerjaan ujian, skripsi atas nama orang lain, atau bentuk kecurangan akademik.",
  ],
  contactDisplay: { showWhatsapp: true, showEmail: true, showSocials: true, showHours: true },

  // Tampilkan pemberitahuan bahwa harga & data masih contoh. Ubah ke false setelah data diganti.
  showSampleNotice: true,

  // Testimoni hanya diisi dengan ulasan asli pelanggan (dengan izin mereka).
  testimonials: [] as { name: string; role: string; quote: string }[],

  about: {
    story:
      "Karya Rapi berawal dari kebiasaan membantu teman dan komunitas membuat poster, merapikan dokumen, dan mengedit video acara. Dari situ kami belajar bahwa banyak orang butuh hasil yang rapi tanpa proses yang rumit.",
    vision: "Menjadi mitra kreatif dan administrasi digital yang terpercaya bagi siapa saja.",
    mission: [
      "Memberikan hasil kerja yang rapi, jelas, dan sesuai kebutuhan.",
      "Menjaga komunikasi yang terbuka dari awal hingga akhir pesanan.",
      "Menawarkan harga yang wajar dan transparan.",
    ],
    values: [
      { title: "Rapi", text: "Setiap detail diperiksa sebelum dikirim." },
      { title: "Jujur", text: "Harga, waktu, dan batasan dijelaskan di awal." },
      { title: "Tepat waktu", text: "Tenggat yang disepakati kami jaga." },
    ],
  },
};

export const waLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
