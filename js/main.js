// Fungsi global untuk menampilkan notifikasi UI
function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Penentuan warna berdasarkan tipe respons
    const bgColor = type === "success" ? "bg-emerald-500" : "bg-red-500";
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded shadow-lg transform transition-all duration-300 translate-x-10 opacity-0 flex items-center gap-2`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Animasi masuk
    setTimeout(() => {
        toast.classList.remove('translate-x-10', 'opacity-0');
    }, 10);
    
    // Animasi keluar dan hapus elemen setelah 3 detik
    setTimeout(() => {
        toast.classList.add('translate-x-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
// ==========================================
// FUNGSI NAVIGASI RESPONSIVE (MOBILE MENU)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    // Fungsi untuk membuka/menutup sidebar
    function toggleSidebar() {
        if (sidebar && sidebarOverlay) {
            // Tailwind memanipulasi posisi X menggunakan class translate
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        }
    }

    // Pasang fungsi klik ke tombol-tombol yang ada
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Tutup menu jika user mengklik area gelap di luar menu
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }
});