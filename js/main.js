/**
 * FinDash - Core Dashboard Engine
 * Created for: Alfan Azis (Informatics Student)
 * Features: Multi-range Filtering, Real-time Aggregation, Triple Visual Charts
 */

// Global Variables untuk menyimpan instance Chart agar bisa di-reset/destroy
let chartLine = null;
let chartDonut = null;
let chartBar = null;

// ==========================================
// 1. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("FinDash Engine Started...");
    
    // Load data pertama kali saat halaman dibuka
    loadDashboardData();

    // Listener untuk filter dropdown kustom tampilan
    const rangeSelect = document.getElementById('rangeSelect');
    if (rangeSelect) {
        rangeSelect.addEventListener('change', () => {
            const customGroup = document.getElementById('customDateGroup');
            if (customGroup) {
                // Tampilkan input tanggal hanya jika pilih 'custom'
                customGroup.classList.toggle('hidden', rangeSelect.value !== 'custom');
            }
            // Langsung reload data saat dropdown diganti
            loadDashboardData();
        });
    }

    // Sidebar Mobile Toggle Logic
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }
});

// ==========================================
// 2. LOGIKA UTAMA: PENARIKAN & FILTER DATA
// ==========================================
async function loadDashboardData() {
    const dashMasuk = document.getElementById('dashMasuk');
    const dashKeluar = document.getElementById('dashKeluar');
    const dashSaldo = document.getElementById('dashSaldo');
    const rangeType = document.getElementById('rangeSelect') ? document.getElementById('rangeSelect').value : 'all';

    // Guard Clause: Cek apakah elemen UI ada (hanya jalan di index.html)
    if (!dashMasuk) return;

    try {
        // Tampilkan Loading State pada angka
        dashMasuk.innerText = "⏳"; dashKeluar.innerText = "⏳"; dashSaldo.innerText = "⏳";

        // 1. Ambil data mentah dari api.js
        const transaksi = await fetchTransactionData();
        
        if (!transaksi || transaksi.length === 0) {
            showToast("Data transaksi kosong!", "error");
            resetDashboardValues();
            return;
        }

        // 2. Tentukan Batas Waktu berdasarkan Filter Dropdown
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        let startLimit = new Date(0); // Default: All time
        let endLimit = new Date(today);

        if (rangeType === 'thisMonth') {
            startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (rangeType === 'lastMonth') {
            startLimit = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endLimit = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (rangeType === '1w') {
            startLimit.setDate(now.getDate() - 7);
        } else if (rangeType === '2w') {
            startLimit.setDate(now.getDate() - 14);
        } else if (rangeType === '1m') {
            startLimit.setMonth(now.getMonth() - 1);
        } else if (rangeType === '1y') {
            startLimit.setFullYear(now.getFullYear() - 1);
        } else if (rangeType === 'custom') {
            const s = document.getElementById('startDate').value;
            const e = document.getElementById('endDate').value;
            if (s && e) {
                startLimit = new Date(s);
                endLimit = new Date(e);
                endLimit.setHours(23, 59, 59);
            }
        }

        // 3. Filter Data Berdasarkan Waktu
        const filteredData = transaksi.filter(t => {
            const d = new Date(t.tanggal);
            return d >= startLimit && d <= endLimit;
        });

        // 4. Proses Kalkulasi (Masuk, Keluar, Kategori, Tren)
        let totalIn = 0;
        let totalOut = 0;
        const catGroup = {};    // Untuk Donut Chart
        const dailyTrend = {};  // Untuk Line Chart
        const monthTrend = {};  // Untuk Bar Chart / Monthly View

        filteredData.forEach(t => {
            const m = Number(t.masuk) || 0;
            const k = Number(t.keluar) || 0;
            const dateObj = new Date(t.tanggal);
            const dateKey = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            const monthKey = dateObj.toLocaleString('id-ID', { month: 'short', year: 'numeric' });

            totalIn += m;
            totalOut += k;

            // Grouping Kategori (Hanya Pengeluaran)
            if (k > 0) {
                const kat = t.kategori || "Umum";
                catGroup[kat] = (catGroup[kat] || 0) + k;
            }

            // Grouping Trend Harian (Garis)
            if (!dailyTrend[dateKey]) dailyTrend[dateKey] = { in: 0, out: 0 };
            dailyTrend[dateKey].in += m;
            dailyTrend[dateKey].out += k;

            // Grouping Trend Bulanan (Batang)
            if (!monthTrend[monthKey]) monthTrend[monthKey] = { in: 0, out: 0 };
            monthTrend[monthKey].in += m;
            monthTrend[monthKey].out += k;
        });

        // 5. Update UI Dashboard
        dashMasuk.innerText = `Rp ${totalIn.toLocaleString('id-ID')}`;
        dashKeluar.innerText = `Rp ${totalOut.toLocaleString('id-ID')}`;
        dashSaldo.innerText = `Rp ${(totalIn - totalOut).toLocaleString('id-ID')}`;

        // 6. Jalankan Visualisasi Grafik
        renderDonut(catGroup);
        renderLine(dailyTrend);
        renderBar(monthTrend, totalIn, totalOut, rangeType);

    } catch (error) {
        console.error("Critical Dashboard Error:", error);
        showToast("Koneksi Database Terputus!", "error");
    }
}

// ==========================================
// 3. FUNGSI VISUALISASI (CHART RENDERING)
// ==========================================

// --- GRAFIK DONUT (PENGELUARAN PER KATEGORI) ---
function renderDonut(data) {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;
    if (chartDonut) chartDonut.destroy();

    chartDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10, family: 'Poppins' } } }
            }
        }
    });
}

// --- GRAFIK GARIS (TREN HARIAN) ---
function renderLine(data) {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;
    if (chartLine) chartLine.destroy();

    const labels = Object.keys(data);
    chartLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Masuk',
                    data: labels.map(l => data[l].in),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2
                },
                {
                    label: 'Keluar',
                    data: labels.map(l => data[l].out),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                y: { grid: { color: 'rgba(71, 85, 105, 0.1)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// --- GRAFIK BATANG (DINAMIS: TOTAL / BULANAN) ---
function renderBar(monthData, totalIn, totalOut, type) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    if (chartBar) chartBar.destroy();

    let labels, dataIn, dataOut;

    // Jika user pilih "Seluruhnya" atau "Trend Per Bulan", tampilkan per bulan
    if (type === 'all' || type === 'monthly' || type === '1y') {
        labels = Object.keys(monthData);
        dataIn = labels.map(l => monthData[l].in);
        dataOut = labels.map(l => monthData[l].out);
    } else {
        // Jika filter pendek, cukup tampilkan perbandingan total
        labels = ['Total Periode Ini'];
        dataIn = [totalIn];
        dataOut = [totalOut];
    }

    chartBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Masuk', data: dataIn, backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Keluar', data: dataOut, backgroundColor: '#ef4444', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(71, 85, 105, 0.1)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// ==========================================
// 4. UI UTILS (TOAST & HELPERS)
// ==========================================
function resetDashboardValues() {
    document.getElementById('dashMasuk').innerText = "Rp 0";
    document.getElementById('dashKeluar').innerText = "Rp 0";
    document.getElementById('dashSaldo').innerText = "Rp 0";
}

function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const color = type === "success" ? "bg-emerald-500" : "bg-red-500";
    
    toast.className = `${color} text-white px-6 py-3 rounded-2xl shadow-2xl transform transition-all duration-300 translate-x-10 opacity-0 flex items-center gap-3 z-50 font-bold text-xs uppercase tracking-widest`;
    toast.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-10', 'opacity-0'), 10);
    
    setTimeout(() => {
        toast.classList.add('translate-x-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Alfan, kode ini sudah mencakup semua logika yang kamu minta.
 * Gunakan Ctrl + F5 untuk merefresh browser agar script baru terdeteksi.
 * Semangat kuliah TI-nya!
 */