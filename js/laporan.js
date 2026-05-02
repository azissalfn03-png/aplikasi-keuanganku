document.addEventListener('DOMContentLoaded', renderAnalysis);

async function renderAnalysis() {
    const tableBody = document.getElementById('analysisTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Memproses data...</td></tr>';

    // Mengambil data secara paralel untuk efisiensi
    const [transaksi, daftarRab] = await Promise.all([
        fetchTransactionData(),
        fetchRAB()
    ]);

    // Hitung total aktual per kategori (hanya pengeluaran)
    const aktualPerKategori = transaksi
        .filter(t => t.jenis === 'keluar')
        .reduce((acc, curr) => {
            acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.keluar;
            return acc;
        }, {});

    tableBody.innerHTML = ''; // Reset tabel

    daftarRab.forEach(rab => {
        const aktual = aktualPerKategori[rab.kategori] || 0;
        const selisih = rab.nominal - aktual;
        const isOver = selisih < 0;

        const row = document.createElement('tr');
        row.className = "border-b border-slate-700 hover:bg-slate-700/30 transition";
        row.innerHTML = `
            <td class="p-4 font-medium">${rab.kategori.replace('_', ' ').toUpperCase()}</td>
            <td class="p-4">Rp ${rab.nominal.toLocaleString()}</td>
            <td class="p-4">Rp ${aktual.toLocaleString()}</td>
            <td class="p-4 ${isOver ? 'text-red-400' : 'text-emerald-400'}">
                Rp ${Math.abs(selisih).toLocaleString()} ${isOver ? '(Over)' : '(Sisa)'}
            </td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${isOver ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}">
                    ${isOver ? 'OVERBUDGET' : 'AMAN'}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fitur Tambahan: Ekspor ke CSV
document.getElementById('exportCsv')?.addEventListener('click', () => {
    // Logika sederhana mengubah tabel menjadi CSV string dan mendownloadnya
    const rows = document.querySelectorAll('table tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(c => c.innerText.replace(/,/g, '')).join(",");
        csvContent += rowData + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_keuangan.csv");
    document.body.appendChild(link);
    link.click();
});

