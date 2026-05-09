// Variabel global untuk menyimpan "instance" grafik agar bisa dihancurkan (di-reset)
let donutChartInstance = null;
let barChartInstance = null;
let allTransactions = []; // Menyimpan data asli dari server

document.addEventListener('DOMContentLoaded', async () => {
    const donutCtx = document.getElementById('donutChart');
    const barCtx = document.getElementById('barChart');
    const monthFilter = document.getElementById('monthFilter');
    
    // Pastikan kita ada di halaman dashboard
    if (donutCtx && barCtx) {
        // 1. Tarik semua data dari API (Hanya 1 kali pemanggilan untuk hemat kuota)
        allTransactions = await fetchTransactionData();
        
        // 2. Isi opsi Dropdown dengan bulan-bulan yang tersedia di database
        populateMonthFilter(allTransactions, monthFilter);

        // 3. Render dashboard untuk pertama kali (Tampilkan 'Semua Waktu')
        renderDashboard(allTransactions);

        // 4. Pasang "Telinga" (Event Listener) pada Dropdown Filter
        if (monthFilter) {
            monthFilter.addEventListener('change', (e) => {
                const selectedMonth = e.target.value;
                
                if (selectedMonth === 'all') {
                    // Jika pilih "Semua Waktu", render data mentah
                    renderDashboard(allTransactions);
                } else {
                    // Jika pilih bulan tertentu, filter array-nya!
                    const filteredData = allTransactions.filter(t => {
                        const dateObj = new Date(t.tanggal);
                        const monthYear = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                        return monthYear === selectedMonth;
                    });
                    renderDashboard(filteredData);
                }
            });
        }
    }
});

// =========================================================================
// FUNGSI 1: MENGISI DROPDOWN SECARA OTOMATIS BERDASARKAN DATA YANG ADA
// =========================================================================
function populateMonthFilter(data, filterElement) {
    if (!filterElement || data.length === 0) return;
    
    // Ambil daftar bulan unik menggunakan teknik Set()
    const uniqueMonths = [...new Set(data.map(t => {
        const dateObj = new Date(t.tanggal);
        return dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }))];

    // Masukkan opsi ke dalam HTML Select
    uniqueMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `📅 ${month}`;
        filterElement.appendChild(option);
    });
}

// =========================================================================
// FUNGSI 2: MERENDER KARTU RINGKASAN & GRAFIK (Bisa dipanggil berulang-ulang)
// =========================================================================
function renderDashboard(data) {
    // --- A. UPDATE KARTU RINGKASAN ---
    const totalMasuk = data.reduce((sum, item) => sum + (item.masuk || 0), 0);
    const totalKeluar = data.reduce((sum, item) => sum + (item.keluar || 0), 0);
    const saldoAkhir = totalMasuk - totalKeluar;

    document.getElementById('dashPemasukan').innerText = `Rp ${totalMasuk.toLocaleString('id-ID')}`;
    document.getElementById('dashPengeluaran').innerText = `Rp ${totalKeluar.toLocaleString('id-ID')}`;
    document.getElementById('dashSaldo').innerText = `Rp ${saldoAkhir.toLocaleString('id-ID')}`;

    // --- B. UPDATE GRAFIK DONAT ---
    const pengeluaran = data.filter(item => item.jenis === 'keluar');
    const kategoriTotal = pengeluaran.reduce((acc, curr) => {
        acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.keluar;
        return acc;
    }, {});

    // WAJIB: Hancurkan grafik lama sebelum membuat yang baru agar tidak *overlap* (tumpang tindih)
    if (donutChartInstance) donutChartInstance.destroy();
    
    const donutCtx = document.getElementById('donutChart');
    donutChartInstance = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(kategoriTotal).map(k => k.replace(/_/g, ' ').toUpperCase()),
            datasets: [{
                data: Object.values(kategoriTotal),
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: {color: '#cbd5e1'} } } }
    });

    // --- C. UPDATE GRAFIK BATANG ---
    if (barChartInstance) barChartInstance.destroy();
    
    const barCtx = document.getElementById('barChart');
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Arus Kas Periode Ini'],
            datasets: [
                { label: 'Pemasukan', data: [totalMasuk], backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Pengeluaran', data: [totalKeluar], backgroundColor: '#ef4444', borderRadius: 6 }
            ]
        },
        options: { 
            responsive: true, 
            scales: { 
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            },
            plugins: { legend: { labels: { color: '#cbd5e1'} } } 
        }
    });
}