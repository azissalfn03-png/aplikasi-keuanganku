// GANTI DENGAN URL DEPLOYMENT APPS SCRIPT ANDA
const SCRIPT_URL = '/api/sheets';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('financeForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submitBtn');
            const nominal = document.getElementById('nominal').value;

            // Client-Side Validation: Cegah nominal negatif atau nol
            if(nominal <= 0) {
                showToast("Nominal harus lebih dari 0", "error");
                return;
            }

            // UI Feedback: Loading state
            const originalText = btn.innerHTML;
            btn.innerHTML = "Merekam...";
            btn.classList.replace('bg-emerald-500', 'bg-slate-500');
            btn.disabled = true;

            const data = {
                keterangan: document.getElementById('keterangan').value,
                jenis: document.getElementById('jenis').value,
                kategori: document.getElementById('kategori').value,
                nominal: nominal
            };

            try {
                // KITA TAMBAHKAN HEADER TEXT/PLAIN BIAR GAK DIBLOKIR HP
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify(data) // Catatan: Kalau di Apps Script butuh 'action', tambahin di variabel data ya!
                });
                
                if(response.ok) {
                    showToast("Transaksi berhasil dicatat!", "success");
                    alert("MANTAP FAN! Datanya sukses meluncur ke Sheets!"); // Alert sukses
                    form.reset();
                } else {
                    throw new Error("Respon server gagal: " + response.status);
                }
            } catch (error) {
                showToast("Gagal menyimpan: " + error.message, "error");
                // INI YANG PALING PENTING: Bikin HP-mu teriak kasih tahu error-nya
                alert("ERROR NGIRIM FAN: " + error.message);
            } finally {
                // Restore UI
                btn.innerHTML = originalText;
                btn.classList.replace('bg-slate-500', 'bg-emerald-500');
                btn.disabled = false;
            }
            
        });
    }
});

// Fungsi untuk menarik data bagi chart/laporan
async function fetchTransactionData() {
    try {
        // Menambahkan ?_=[timestamp] agar browser selalu mengambil data terbaru dari Sheets
        const response = await fetch(`${SCRIPT_URL}?action=getTransaksi&_=${new Date().getTime()}`);
        return await response.json();
    } catch (e) {
        console.error("Gagal mengambil data:", e);
        return [];
    }
}
// Tambahkan di api.js

async function saveRAB(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveRAB', ...data })
        });
        return await response.json();
    } catch (e) {
        console.error("Gagal simpan RAB", e);
    }
}

async function fetchRAB() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getRAB`);
        return await response.json();
    } catch (e) {
        console.error("Gagal ambil RAB", e);
        return [];
    }
}
// Tambahkan di bagian paling bawah api.js
async function editTransactionData(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'editTransaksi', ...data })
        });
        return await response.json();
    } catch (e) {
        throw new Error("Gagal terhubung ke server");
    }
}

// Tambahkan di bagian paling bawah api.js
async function editRABData(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'editRAB', ...data })
        });
        return await response.json();
    } catch (e) {
        throw new Error("Gagal terhubung ke server");
    }
}

// ==========================================
// FUNGSI UNTUK MENGIRIM DATA EDIT TRANSAKSI
// ==========================================
async function editTransactionData(dataToUpdate) {
    try {
        // SCRIPT_URL akan mengambil link yang sudah Anda atur di bagian atas api.js
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(dataToUpdate)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Gagal mengirim editan ke server:", error);
        throw error; // Lemparkan error agar ditangkap oleh riwayat.js
    }
}

