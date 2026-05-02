// GANTI DENGAN URL DEPLOYMENT APPS SCRIPT ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzI96VWxIVe0PWsOeeDi9j55hknY1M7dt9SgZok6HX073TU2qakozIdzXH_mlBk1b_cdw/exec';

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
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                if(response.ok) {
                    showToast("Transaksi berhasil dicatat!", "success");
                    form.reset();
                } else {
                    throw new Error("Network response was not ok");
                }
            } catch (error) {
                showToast("Gagal menyimpan: " + error.message, "error");
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
        const response = await fetch(SCRIPT_URL);
        return await response.json();
    } catch (error) {
        console.error("Gagal menarik data:", error);
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