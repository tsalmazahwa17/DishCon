import {
  FiActivity,
  FiBell,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCoffee,
  FiGift,
  FiGrid,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMessageCircle,
  FiPieChart,
  FiSearch,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiZap
} from "react-icons/fi";

export const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#tentang", label: "Tentang" }
];

export const featureCards = [
  {
    icon: FiHeart,
    title: "Donasi Makanan",
    desc: "Donatur dapat mengunggah makanan berlebih, jumlah porsi, lokasi, dan waktu pengambilan dengan mudah."
  },
  {
    icon: FiZap,
    title: "Deteksi Nutrisi & Alergen",
    desc: "AI membantu menampilkan informasi nutrisi dasar dan potensi alergen dari makanan yang didonasikan."
  },
  {
    icon: FiClock,
    title: "Prediksi Kedaluwarsa",
    desc: "AI memperkirakan batas aman konsumsi makanan berdasarkan jenis makanan dan waktu penyimpanan."
  },
  {
    icon: FiActivity,
    title: "Pelacakan Pengajuan",
    desc: "Penerima dapat memantau status pengajuan makanan dari menunggu, disetujui, hingga diterima."
  }
];

export const stats = [
  { icon: FiUsers, number: "3 Role", label: "User Terintegrasi" },
  { icon: FiActivity, number: "CO2 Saved", label: "Emisi yang Diselamatkan" },
  { icon: FiGift, number: "Real-time", label: "Makanan yang Didonasikan" }
];

export const howItWorks = [
  { title: "Donatur unggah makanan", desc: "Foto dan masukkan detail makanan yang ingin didonasikan melalui aplikasi." },
  { title: "Analisis AI", desc: "AI menganalisis nutrisi, mendeteksi alergen, dan memberi estimasi kedaluwarsa." },
  { title: "Pengajuan Permintaan", desc: "Penerima terdekat melihat daftar makanan dan mengajukan permintaan." },
  { title: "Penyaluran Selesai", desc: "Donasi disalurkan, diambil oleh penerima, dan status tercatat di sistem." }
];

export const recipientMenu = [
  { href: "/recipient", label: "Dashboard", icon: FiGrid },
  { href: "/history", label: "Riwayat Pengajuan", icon: FiClock },
  { href: "/profile", label: "Profil", icon: FiUser },
  { href: "/notifications", label: "Notifikasi", icon: FiBell },
  { href: "/complaint", label: "Pusat Pengaduan", icon: FiMessageCircle },
  { href: "/settings", label: "Bantuan / Settings", icon: FiSettings }
];

export const donorMenu = [
  { href: "/donor", label: "Dashboard", icon: FiHome },
  { href: "/history", label: "Riwayat Donasi", icon: FiClock },
  { href: "/profile", label: "Profil", icon: FiUser },
  { href: "/notifications", label: "Notifikasi", icon: FiBell },
  { href: "/donate", label: "Donate Now", icon: FiHeart, highlight: true },
  { href: "/complaint", label: "Pusat Pengaduan", icon: FiMessageCircle },
  { href: "/settings", label: "Settings", icon: FiSettings }
];

export const catalogMenu = [
  { href: "/recipient", label: "Dashboard", icon: FiHome },
  { href: "/catalog", label: "Cari Makanan", icon: FiSearch },
  { href: "/history", label: "Pengajuan Saya", icon: FiClock },
  { href: "/history", label: "Riwayat", icon: FiActivity },
  { href: "/catalog", label: "Favorit", icon: FiHeart },
  { href: "/settings", label: "Preferensi", icon: FiSettings },
  { href: "/complaint", label: "Pusat Bantuan", icon: FiMessageCircle },
  { href: "/#tentang", label: "Tentang DishCon", icon: FiShield }
];

export const adminMenu = [
  { label: "DASHBOARD", items: [
    { href: "/admin", label: "Overview", icon: FiPieChart },
    { href: "/admin", label: "Analitik", icon: FiTrendingUp }
  ] },
  { label: "MANAJEMEN", items: [
    { href: "/admin", label: "Donasi", icon: FiGift, badge: "12" },
    { href: "/admin", label: "Pengajuan", icon: FiBox, badge: "8" },
    { href: "/admin", label: "Pengguna", icon: FiUsers },
    { href: "/admin", label: "Donatur", icon: FiUser },
    { href: "/admin", label: "Penerima", icon: FiUser }
  ] },
  { label: "SISTEM", items: [
    { href: "/admin", label: "Pengaturan AI", icon: FiZap },
    { href: "/admin", label: "Zona Distribusi", icon: FiMapPin },
    { href: "/admin", label: "Notifikasi", icon: FiBell },
    { href: "/admin", label: "Konfigurasi", icon: FiSettings },
    { href: "/admin", label: "Keamanan", icon: FiShield }
  ] }
];

export const foodItems = [
  {
    id: 1,
    name: "Nasi Box Ayam",
    donor: "Restoran Sehat",
    portions: "20 porsi tersedia",
    distance: "1.2 km",
    deadline: "24 Mei, 10:00",
    status: "Aman",
    tag: "Rekomendasi AI untuk Anda",
    category: "Makanan Berat",
    emoji: "🍱",
    accent: "from-emerald-100 to-amber-100"
  },
  {
    id: 2,
    name: "Sup Ayam Sayur",
    donor: "Dapur Berkah",
    portions: "12 porsi tersedia",
    distance: "1.6 km",
    deadline: "24 Mei, 11:30",
    status: "Segera",
    category: "Makanan Berat",
    emoji: "🍲",
    accent: "from-yellow-100 to-emerald-100"
  },
  {
    id: 3,
    name: "Roti Assorted",
    donor: "Bakery House",
    portions: "15 porsi tersedia",
    distance: "2.3 km",
    deadline: "24 Mei, 14:00",
    status: "Aman",
    category: "Snack/Kue",
    emoji: "🥐",
    accent: "from-orange-100 to-stone-100"
  },
  {
    id: 4,
    name: "Tumis Daging & Sayur",
    donor: "Warung Nusantara",
    portions: "10 porsi tersedia",
    distance: "2.8 km",
    deadline: "24 Mei, 16:00",
    status: "Prioritas",
    category: "Makanan Berat",
    emoji: "🥩",
    accent: "from-violet-100 to-rose-100"
  },
  {
    id: 5,
    name: "Buah Potong Segar",
    donor: "Fresh Fruit",
    portions: "25 porsi tersedia",
    distance: "3.0 km",
    deadline: "24 Mei, 18:00",
    status: "Aman",
    category: "Buah & Sayur",
    emoji: "🍉",
    accent: "from-sky-100 to-emerald-100"
  },
  {
    id: 6,
    name: "Mie Ayam Bakso",
    donor: "Warung Makan Bu Sri",
    portions: "8 porsi tersedia",
    distance: "1.9 km",
    deadline: "Hari ini, 13:00",
    status: "Segera",
    category: "Makanan Berat",
    emoji: "🍜",
    accent: "from-amber-100 to-orange-100"
  }
];

export const requests = [
  { id: "REQ-0824-A1", donor: "KFC Sudirman", item: "20 Porsi Ayam Goreng", date: "24 May 2024, 08:30", status: "Disetujui" },
  { id: "REQ-0824-A2", donor: "Hotel Mulia", item: "15 kg Prasmanan Sisa", date: "23 May 2024, 14:15", status: "Menunggu" },
  { id: "REQ-0823-B5", donor: "Superindo", item: "5 kg Buah Segar", date: "20 May 2024, 09:00", status: "Selesai" }
];

export const adminRows = [
  { food: "Nasi Box Ayam", donor: "Restoran Sehat", recipient: "Siti Nurhaliza", id: "#2341", location: "Kebayoran, Jaksel", distance: "1.2 km dari donatur", portions: "20 porsi", status: "Menunggu", time: "24 Mei, 08:30", ago: "2 jam lalu" },
  { food: "Sup Ayam Sayur", donor: "Dapur Berkah", recipient: "Ahmad Ramadan", id: "#1876", location: "Cilandak, Jaksel", distance: "1.6 km dari donatur", portions: "12 porsi", status: "Segera!", time: "24 Mei, 09:00", ago: "1.5 jam lalu" },
  { food: "Roti Assorted", donor: "Bakery House", recipient: "Dewi Rahayu", id: "#3021", location: "Pesanggrahan, Jaksel", distance: "2.3 km dari donatur", portions: "15 porsi", status: "Ditinjau AI", time: "24 Mei, 09:20", ago: "1 jam lalu" },
  { food: "Buah Potong", donor: "Fresh Fruit", recipient: "Budi Santoso", id: "#0934", location: "Jagakarsa, Jaksel", distance: "3.1 km dari donatur", portions: "25 porsi", status: "Menunggu", time: "24 Mei, 10:05", ago: "30 mnt lalu" }
];
