// SetupBackend.gs

function jalankanSetup(data) {
  try {
    buatSemuaSheet();
    const folderId = buatFolderDrive(data.namaSekolah);
    var tetapanBaru = {
      NAMA_SEKOLAH: data.namaSekolah,
      KOD_SEKOLAH: data.kodSekolah,
      JENIS_SEKOLAH: data.jenisSekolah || 'rendah',
      TAHUN_AKADEMIK: data.tahunAkademik,
      DRIVE_FOLDER_ID: folderId,
      TARIKH_SETUP: new Date().toLocaleDateString('ms-MY')
    };
    if (data.tahunKokuUnit !== undefined) {
      tetapanBaru.TAHUN_KOKU_UNIT = data.tahunKokuUnit;
      tetapanBaru.TAHUN_KOKU_KELAB = data.tahunKokuKelab;
      tetapanBaru.TAHUN_KOKU_SUKAN = data.tahunKokuSukan;
    }
    simpanTetapan(tetapanBaru);
    simpanPengguna(data.passwordAdmin, data.passwordGuru);
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function buatSemuaSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const senaraiSheet = [
    {
      nama: 'TETAPAN',
      header: ['KUNCI', 'NILAI']
    },
    {
      nama: 'MURID_MASTER',
      header: ['IC', 'NAMA', 'TAHUN', 'KELAS',
               'KELAS_LABEL', 'JANTINA', 'AGAMA',
               'KAUM', 'STATUS', 'TARIKH_KEMASKINI']
    },
    {
      nama: 'KELAB',
      header: ['ID_KELAB', 'NAMA_KELAB', 'KATEGORI',
               'JENIS_KELAB', 'GURU_PENASIHAT_1',
               'GURU_PENASIHAT_2', 'STATUS']
    },
    {
      nama: 'KEAHLIAN',
      header: ['IC', 'ID_KELAB', 'KATEGORI',
               'JAWATAN', 'TAHUN_AKADEMIK', 'STATUS']
    },
    {
      nama: 'PERJUMPAAN',
      header: ['ID_PERJUMPAAN', 'ID_KELAB',
               'TARIKH', 'MASA', 'TEMPAT',
               'BIL_HADIR', 'BIL_AHLI']
    },
    {
      nama: 'KEHADIRAN',
      header: ['ID_PERJUMPAAN', 'IC', 'STATUS']
    },
    {
      nama: 'LAPORAN_PERJUMPAAN',
      header: ['ID_LAPORAN', 'ID_PERJUMPAAN',
               'ID_KELAB', 'TAJUK', 'AKTIVITI',
               'NAMA_GURU', 'TARIKH_HANTAR', 'PDF_URL']
    },
    {
      nama: 'GAMBAR_LAPORAN',
      header: ['ID_GAMBAR', 'ID_LAPORAN',
               'NAMA_FAIL', 'URL_DRIVE']
    },
    {
      nama: 'PENCAPAIAN',
      header: ['ID_PENCAPAIAN', 'IC',
               'NAMA_PERTANDINGAN',
               'KATEGORI_PERTANDINGAN', 'PERINGKAT',
               'TEMPAT_KEPUTUSAN', 'JENIS_PENGLIBATAN',
               'TARIKH', 'GURU_PENGIRING',
               'ID_KELAB', 'TAHUN_AKADEMIK']
    },
    {
      nama: 'PENILAIAN_KOKU',
      header: ['IC', 'ID_KELAB', 'TAHUN_AKADEMIK',
               'MARKAH_JAWATAN', 'MARKAH_PENGLIBATAN',
               'MARKAH_KOMITMEN', 'MARKAH_KHIDMAT',
               'MARKAH_KEHADIRAN', 'MARKAH_PENCAPAIAN',
               'JUMLAH_110', 'JUMLAH_100']
    },
    {
      nama: 'KOMITMEN_DETAIL',
      header: ['IC', 'ID_KELAB', 'TAHUN_AKADEMIK',
               'ASPEK_KOMITMEN', 'MARKAH']
    },
    {
      nama: 'EKSTRA_KURIKULUM',
      header: ['IC', 'TAHUN_AKADEMIK', 'JENIS_EKSTRA',
               'PERKARA', 'PERINGKAT', 'MARKAH']
    },
    {
      nama: 'PAJSK_SUMMARY',
      header: ['IC', 'TAHUN', 'MARKAH_KP',
               'MARKAH_PBB', 'MARKAH_SP', 'EKSTRA',
               'GPA', 'CGPA', 'MARKAH_10_PERATUS',
               'GRED']
    },
    {
      nama: 'GURU',
      header: ['ID_GURU', 'NAMA_GURU', 'JAWATAN']
    },
    {
      nama: 'PENGGUNA',
      header: ['ID_PENGGUNA', 'PERANAN',
               'PASSWORD_HASH']
    },
    {
      nama: 'LOG_AKTIVITI',
      header: ['TARIKH_MASA', 'PENGGUNA',
               'TINDAKAN', 'BUTIRAN']
    }
  ];

  senaraiSheet.forEach(function(s) {
    var sheet = ss.getSheetByName(s.nama);
    if (!sheet) {
      sheet = ss.insertSheet(s.nama);
      sheet.getRange(1, 1, 1, s.header.length)
           .setValues([s.header]);
      sheet.getRange(1, 1, 1, s.header.length)
           .setBackground('#1a73e8')
           .setFontColor('#ffffff')
           .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  var sheetDefault = ss.getSheetByName('Sheet1');
  if (sheetDefault) ss.deleteSheet(sheetDefault);
}

function buatFolderDrive(namaSekolah) {
  var namaFolder = 'AKSI (' +
    namaSekolah + ')';
  var folder = DriveApp.createFolder(namaFolder);
  folder.createFolder('Laporan Perjumpaan');
  folder.createFolder('Gambar Aktiviti');
  folder.createFolder('Backup');
  return folder.getId();
}

function simpanTetapan(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('TETAPAN');
  if (!sheet) sheet = ss.insertSheet('TETAPAN');
  sheet.clearContents();
  var rows = Object.entries(data).map(function(e) {
    return [e[0], e[1]];
  });
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  try {
    CacheService.getScriptCache().remove('TETAPAN_V1');
  } catch(e) {}
}

function simpanPengguna(passwordAdmin, passwordGuru) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PENGGUNA');
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1,
      sheet.getLastRow() - 1, 3).clearContent();
  }
  sheet.appendRow(['admin', 'admin',
    hashPassword(passwordAdmin)]);
  sheet.appendRow(['guru', 'guru',
    hashPassword(passwordGuru)]);
}

function semakSetup() {
  var tetapan = getTetapan();
  return tetapan && tetapan.NAMA_SEKOLAH ? true : false;
}
// ============================================
// RESET UNTUK SEKOLAH BARU (v2.3)
// JALANKAN SECARA MANUAL DARI EDITOR SAHAJA —
// selepas membuat salinan spreadsheet untuk
// sekolah baru. Fungsi ini:
//   1. Kosongkan SEMUA data (kekalkan header)
//   2. Kosongkan TETAPAN → wizard Setup muncul semula
//   3. Padam sheet arkib
//   4. Padam semua sesi login & trigger
// TIDAK menyentuh fail Drive sekolah asal
// (salinan baru akan cipta folder Drive sendiri).
// ============================================
function resetUntukSekolahBaru() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Kosongkan data, kekalkan baris header
  var sheetData = [
    'MURID_MASTER', 'KELAB', 'KEAHLIAN',
    'PERJUMPAAN', 'KEHADIRAN', 'LAPORAN_PERJUMPAAN',
    'GAMBAR_LAPORAN', 'PENCAPAIAN', 'PENILAIAN_KOKU',
    'KOMITMEN_DETAIL', 'EKSTRA_KURIKULUM',
    'PAJSK_SUMMARY', 'GURU', 'PENGGUNA',
    'LOG_AKTIVITI'
  ];
  sheetData.forEach(function(nama) {
    var sheet = ss.getSheetByName(nama);
    if (sheet && sheet.getLastRow() > 1) {
      // clearContent elak ralat "delete all
      // non-frozen rows" pada baris beku
      sheet.getRange(2, 1, sheet.getLastRow() - 1,
        sheet.getMaxColumns()).clearContent();
    }
  });

  // 2. Kosongkan TETAPAN sepenuhnya
  //    (termasuk DRIVE_FOLDER_ID & LOGO sekolah lama)
  var tetapan = ss.getSheetByName('TETAPAN');
  if (tetapan) tetapan.clearContents();

  // Kosongkan cache — jika tidak, web app masih
  // "ingat" tetapan lama sehingga 5 minit
  cacheBuang('TETAPAN_V1');
  cacheBuang('KELAB_AKTIF_V1');
  cacheBuang('KELAS_AKTIF_V1');

  // 3. Padam sheet arkib (dicipta semula bila perlu)
  ['ARKIB_PERJUMPAAN', 'ARKIB_KEHADIRAN',
   'ARKIB_LAPORAN', 'ARKIB_GAMBAR'
  ].forEach(function(nama) {
    var sheet = ss.getSheetByName(nama);
    if (sheet) ss.deleteSheet(sheet);
  });

  // 4. Padam semua sesi login tersimpan
  PropertiesService.getScriptProperties().deleteAllProperties();

  // 5. Padam semua trigger (backup automatik dll)
  ScriptApp.getProjectTriggers().forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });

  Logger.log('Reset selesai. Buka URL /exec — ' +
    'wizard Setup akan muncul untuk sekolah baru.');
}
