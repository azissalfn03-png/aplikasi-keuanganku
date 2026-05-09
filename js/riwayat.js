document.addEventListener('DOMContentLoaded', () => {
    // Jalankan fungsi load data saat halaman siap
    loadRiwayatData();
});

// === 1. DEFINISI VARIABEL GLOBAL (Diletakkan di atas agar terbaca semua fungsi) ===
const modal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const checkCustomDate = document.getElementById('editUseCustomDate');
const customDateContainer = document.getElementById('editCustomDateContainer');

// === 2. FUNGSI LOAD DATA (MENAMPILKAN TABEL) ===
async function loadRiwayatData() {
    const tableBody = document.getElementById('riwayatTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400 animate-pulse">Sinkronisasi dengan Google Sheets...</td></tr>';

    try {
        const transaksi = await fetchTransactionData();
        tableBody.innerHTML = ''; 

        if (!transaksi || transaksi.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">Belum ada riwayat transaksi.</td></tr>';
            return;
        }

        // Urutkan dari yang terbaru (tampilan web)
        const reversedTransaksi = [...transaksi].reverse();
        let currentMonthYear = '';

        reversedTransaksi.forEach(t => {
            const dateObj = new Date(t.tanggal);
            const tgl = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const monthYear = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

            // Divider Bulan
            if (monthYear !== currentMonthYear) {
                currentMonthYear = monthYear;
                const dividerRow = document.createElement('tr');
                dividerRow.className = "bg-slate-800/50 border-b-2 border-slate-700";
                dividerRow.innerHTML = `
                    <td colspan="6" class="p-4">
                        <span class="text-emerald-400 font-bold uppercase tracking-widest text-xs">📅 ${monthYear}</span>
                    </td>
                `;
                tableBody.appendChild(dividerRow);
            }

            const isMasuk = t.jenis === 'masuk';
            const nominal = isMasuk ? t.masuk : t.keluar;
            const nominalText = `Rp ${nominal.toLocaleString('id-ID')}`;
            
            // Encode data agar aman jika ada karakter aneh (seperti tanda kutip)
            const safeKet = encodeURIComponent(t.keterangan);
            const safeKat = encodeURIComponent(t.kategori);

            const row = document.createElement('tr');
            row.className = "border-b border-slate-700/50 hover:bg-slate-700/30 transition text-sm";
            row.innerHTML = `
                <td class="p-4 text-slate-400 text-xs">${tgl}</td>
                <td class="p-4 font-medium text-slate-200">${t.keterangan}</td>
                <td class="p-4 capitalize text-slate-400">${String(t.kategori).replace(/_/g, ' ')}</td>
                <td class="p-4 text-center">
                    <span class="px-2 py-1 rounded text-[10px] font-bold ${isMasuk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">${t.jenis.toUpperCase()}</span>
                </td>
                <td class="p-4 text-right font-bold ${isMasuk ? 'text-emerald-400' : 'text-red-400'}">${isMasuk ? '+' : '-'}${nominalText}</td>
                <td class="p-4 text-center">
                    <button onclick="openEditModal(${t.rowNumber}, decodeURIComponent('${safeKet}'), decodeURIComponent('${safeKat}'), '${t.jenis}', ${nominal}, '${t.tanggal}')" 
                            class="text-slate-500 hover:text-emerald-400 transition transform hover:scale-110" title="Edit Transaksi">
                        ✏️
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Load Error:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-400">Gagal memuat data server.</td></tr>';
    }
}

// === 3. FUNGSI UNTUK MODAL EDIT ===

// Helper: Ubah format tanggal Sheets ke format input datetime-local
function formatToInputDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const z = n => (n < 10 ? '0' : '') + n;
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

window.openEditModal = function(rowNum, keterangan, kategori, jenis, nominal, tanggalAsli) {
    if (!modal) return;

    // Isi Data Dasar
    document.getElementById('editRowNumber').value = rowNum;
    document.getElementById('editKeterangan').value = keterangan;
    document.getElementById('editNominal').value = Math.round(nominal);
    document.getElementById('editJenis').value = String(jenis).toLowerCase();
    
    // Simpan Tanggal Asli (Backup jika user tidak klik centang ubah tanggal)
    document.getElementById('editTanggalAsli').value = tanggalAsli;
    
    // Siapkan Kalender (otomatis terisi tanggal asli)
    const inputTglBaru = document.getElementById('editTanggalBaru');
    if (inputTglBaru) inputTglBaru.value = formatToInputDate(tanggalAsli);

    // Reset Checkbox & Container Tanggal
    if (checkCustomDate) checkCustomDate.checked = false;
    if (customDateContainer) customDateContainer.classList.add('hidden');

    // Pilih Kategori yang sesuai
    const katSelect = document.getElementById('editKategori');
    if (katSelect) {
        let found = false;
        for (let i = 0; i < katSelect.options.length; i++) {
            if (katSelect.options[i].text.toLowerCase() === String(kategori).toLowerCase()) {
                katSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) katSelect.selectedIndex = 0;
    }

    modal.classList.remove('hidden');
}

window.closeModal = function() {
    if (modal) modal.classList.add('hidden');
}

// Logika Muncul/Sembunyi Kalender di Modal Edit
if (checkCustomDate) {
    checkCustomDate.addEventListener('change', function() {
        if (this.checked) {
            customDateContainer.classList.remove('hidden');
        } else {
            customDateContainer.classList.add('hidden');
        }
    });
}

// === 4. FUNGSI SUBMIT (UPDATE KE GOOGLE SHEETS) ===
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveEditBtn');
        const originalText = btn.innerHTML;

        // Tentukan Tanggal Mana yang Dikirim
        const isCustom = checkCustomDate.checked;
        const tanggalAsli = document.getElementById('editTanggalAsli').value;
        const tanggalBaruInput = document.getElementById('editTanggalBaru').value;
        
        let tanggalFinal;
        if (isCustom && tanggalBaruInput) {
            tanggalFinal = new Date(tanggalBaruInput).toISOString();
        } else {
            tanggalFinal = tanggalAsli;
        }

        const katSelect = document.getElementById('editKategori');
        const dataToUpdate = {
            action: 'editTransaksi',
            rowNumber: document.getElementById('editRowNumber').value,
            keterangan: document.getElementById('editKeterangan').value,
            jenis: document.getElementById('editJenis').value,
            kategori: katSelect.options[katSelect.selectedIndex].text,
            nominal: Number(document.getElementById('editNominal').value),
            tanggal: tanggalFinal
        };

        try {
            btn.innerHTML = "Menyimpan...";
            btn.disabled = true;

            const result = await editTransactionData(dataToUpdate);
            
            if (result.status === 'success') {
                showToast("Data berhasil diperbarui!", "success");
                closeModal();
                loadRiwayatData(); // Refresh Tabel
            } else {
                throw new Error(result.message || "Gagal di sisi server");
            }
        } catch (error) {
            console.error("Update Error:", error);
            showToast("Gagal: " + error.message, "error");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}