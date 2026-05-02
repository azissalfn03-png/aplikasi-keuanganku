// 1. FUNGSI MENYIMPAN DATA (DARI WEB KE SHEETS)
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  var keterangan = data.keterangan;
  var jenis = data.jenis; 
  var nominal = Number(data.nominal);
  
  var uangMasuk = 0;
  var uangKeluar = 0;
  
  if (jenis === "masuk") {
    uangMasuk = nominal;
  } else {
    uangKeluar = nominal;
  }
  
  var lastRow = sheet.getLastRow();
  var uangSisaSebelumnya = 0;
  
  if (lastRow > 1) {
    // Mengambil saldo terakhir di Kolom E
    uangSisaSebelumnya = Number(sheet.getRange(lastRow, 5).getValue()) || 0;
  }
  
  var uangSisaSekarang = uangSisaSebelumnya + uangMasuk - uangKeluar;
  
  // Masukkan data ke baris baru
  sheet.appendRow([
    new Date(), 
    keterangan, 
    uangMasuk, 
    uangKeluar, 
    uangSisaSekarang
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. FUNGSI MENARIK DATA SALDO (DARI SHEETS KE WEB)
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  var totalPemasukan = 0;
  var totalPengeluaran = 0;

  for (var i = 1; i < data.length; i++) {
    totalPemasukan += Number(data[i][2]) || 0; // Kolom C
    totalPengeluaran += Number(data[i][3]) || 0; // Kolom D
  }

  var sisaUang = totalPemasukan - totalPengeluaran;

  var result = {
    "pemasukan": totalPemasukan,
    "pengeluaran": totalPengeluaran,
    "sisa": sisaUang
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}