document.addEventListener('DOMContentLoaded', loadRiwayatData);

async function loadRiwayatData() {
    const tableBody = document.getElementById('riwayatTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Mengambil data transaksi...</td></tr>'; // Ubah colspan jadi 6

    try {
        const transaksi = await fetchTransactionData();
        tableBody.innerHTML = ''; 

        if (!transaksi || transaksi.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">Belum ada riwayat transaksi.</td></tr>';
            return;
        }

        const reversedTransaksi = transaksi.reverse();
        let currentMonthYear = '';

        reversedTransaksi.forEach(t => {
            const dateObj = new Date(t.tanggal);
            const tgl = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const monthYear = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

            if (monthYear !== currentMonthYear) {
                currentMonthYear = monthYear;
                const dividerRow = document.createElement('tr');
                dividerRow.className = "bg-slate-800 border-b-2 border-slate-700";
                dividerRow.innerHTML = `
                    <td colspan="6" class="p-4">
                        <span class="text-emerald-400 font-bold uppercase tracking-widest text-base">📅 ${monthYear}</span>
                    </td>
                `;
                tableBody.appendChild(dividerRow);
            }

            const isMasuk = t.jenis === 'masuk';
            const nominal = isMasuk ? t.masuk : t.keluar;
            const nominalText = `${isMasuk ? '+' : '-'} Rp ${nominal.toLocaleString('id-ID')}`;
            const nominalClass = isMasuk ? 'text-emerald-400' : 'text-red-400';
            const badgeClass = isMasuk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400';

            const row = document.createElement('tr');
            row.className = "border-b border-slate-700/50 hover:bg-slate-700/30 transition text-sm";
            row.innerHTML = `
                <td class="p-4 text-slate-300">${tgl}</td>
                <td class="p-4 font-medium">${t.keterangan}</td>
                <td class="p-4 capitalize">${t.kategori.replace(/_/g, ' ')}</td>
                <td class="p-4 text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold ${badgeClass}">${t.jenis.toUpperCase()}</span>
                </td>
                <td class="p-4 text-right font-bold ${nominalClass}">${nominalText}</td>
                <td class="p-4 text-center">
                    <!-- TOMBOL EDIT -->
                    <button onclick="openEditModal(${t.rowNumber}, '${t.keterangan}', '${t.kategori}', '${t.jenis}', ${nominal})" class="text-slate-400 hover:text-emerald-400 transition" title="Edit Data">
                        ✏️
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-400">Gagal memuat data.</td></tr>';
    }
}

// ==========================================
// FUNGSI KONTROL MODAL EDIT
// ==========================================
const modal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');

// Buka Modal & Isi Datanya
window.openEditModal = function(rowNum, keterangan, kategori, jenis, nominal) {
    document.getElementById('editRowNumber').value = rowNum;
    document.getElementById('editKeterangan').value = keterangan;
    document.getElementById('editKategori').value = kategori.toLowerCase().replace(/ /g, '_');
    document.getElementById('editJenis').value = jenis;
    document.getElementById('editNominal').value = nominal;
    
    modal.classList.remove('hidden');
}

// Tutup Modal
window.closeModal = function() {
    modal.classList.add('hidden');
}

// Submit Editan ke Database
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveEditBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = "Menyimpan Ulang...";
        btn.classList.replace('bg-emerald-500', 'bg-slate-500');
        btn.disabled = true;

        const dataToUpdate = {
            rowNumber: document.getElementById('editRowNumber').value,
            keterangan: document.getElementById('editKeterangan').value,
            jenis: document.getElementById('editJenis').value,
            kategori: document.getElementById('editKategori').value,
            nominal: document.getElementById('editNominal').value
        };

        try {
            await editTransactionData(dataToUpdate);
            showToast("Data berhasil diperbarui!", "success");
            closeModal();
            loadRiwayatData(); // Refresh tabel secara otomatis
        } catch (error) {
            showToast("Gagal mengupdate data", "error");
        } finally {
            btn.innerHTML = originalText;
            btn.classList.replace('bg-slate-500', 'bg-emerald-500');
            btn.disabled = false;
        }
    });
}