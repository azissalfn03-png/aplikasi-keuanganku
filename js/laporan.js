document.addEventListener('DOMContentLoaded', renderAnalysis);

async function renderAnalysis() {
    const tableBody = document.getElementById('analysisTableBody');
    if (!tableBody) return;

    // Tampilkan loading yang rapi
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="p-10 text-center">
                <div class="flex flex-col items-center gap-2">
                    <div class="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span class="text-slate-500 text-xs italic">Menghitung akumulasi kategori...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        // 1. Ambil data RAB dan Transaksi secara bersamaan (Parallel Fetch)
        const [transaksi, dataRAB] = await Promise.all([
            fetchTransactionData(), // Fungsi dari api.js
            fetchRABData()          // Fungsi pembantu di bawah
        ]);

        // 2. AGREGASI RAB: Kumpulkan Target per Kategori
        const targetPerKategori = {};
        dataRAB.forEach(r => {
            const kat = r.kategori;
            const nominal = Number(r.nominal) || 0;
            // Jika ada kategori yang sama di RAB, jumlahkan nominalnya
            targetPerKategori[kat] = (targetPerKategori[kat] || 0) + nominal;
        });

        // 3. AGREGASI TRANSAKSI: Kumpulkan Realisasi per Kategori
        const realisasiPerKategori = {};
        transaksi.forEach(t => {
            // Hanya hitung yang jenisnya "keluar"
            if (t.jenis && t.jenis.toLowerCase() === 'keluar') {
                const kat = t.kategori;
                const nominal = Number(t.keluar) || 0;
                // Jika kategori sama, akumulasikan pengeluarannya
                realisasiPerKategori[kat] = (realisasiPerKategori[kat] || 0) + nominal;
            }
        });

        // 4. RENDER KE TABEL
        tableBody.innerHTML = '';
        const daftarKategori = Object.keys(targetPerKategori);

        if (daftarKategori.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-slate-500">Data RAB belum diisi.</td></tr>';
            return;
        }

        daftarKategori.forEach(kat => {
            const target = targetPerKategori[kat] || 0;
            const aktual = realisasiPerKategori[kat] || 0;
            const selisih = target - aktual;

            // Penentuan Badge Status
            let statusBadge = '';
            if (selisih < 0) {
                statusBadge = '<span class="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">OVER BUDGET</span>';
            } else if (aktual === 0) {
                statusBadge = '<span class="px-2 py-1 rounded bg-slate-700/50 text-slate-500 text-[10px] font-bold border border-slate-700/20">BELUM TERPAKAI</span>';
            } else {
                statusBadge = '<span class="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">AMAN</span>';
            }

            const row = document.createElement('tr');
            row.className = "hover:bg-slate-700/20 transition-colors border-b border-slate-700/30";
            row.innerHTML = `
                <td class="p-5 font-bold text-slate-200">${kat}</td>
                <td class="p-5 text-right font-mono text-slate-400 italic">Rp ${target.toLocaleString('id-ID')}</td>
                <td class="p-5 text-right font-mono text-white font-bold">Rp ${aktual.toLocaleString('id-ID')}</td>
                <td class="p-5 text-right font-mono ${selisih < 0 ? 'text-red-400' : 'text-emerald-400'}">
                    ${selisih < 0 ? '-' : ''}Rp ${Math.abs(selisih).toLocaleString('id-ID')}
                </td>
                <td class="p-5 text-center">${statusBadge}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Gagal Analisis:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-red-400 text-xs">⚠️ Gagal memproses data. Pastikan koneksi ke Google Sheets lancar.</td></tr>';
    }
}

// Fungsi Helper untuk menarik data dari Sheet RAB
async function fetchRABData() {
    try {
        const response = await fetch(SCRIPT_URL + "?action=getRAB");
        if (!response.ok) throw new Error("Gagal mengambil data RAB");
        return await response.json();
    } catch (error) {
        console.error("Fetch RAB Error:", error);
        return [];
    }
}