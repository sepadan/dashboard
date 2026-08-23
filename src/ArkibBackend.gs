// ArkibBackend.gs
// Fasa 5 — Arkib Tahun Akademik & Backup Automatik
//
// KONSEP:
// - Sheet KEAHLIAN, PENCAPAIAN, PENILAIAN_KOKU, EKSTRA_KURIKULUM,
//   KOMITMEN_DETAIL, PAJSK_SUMMARY sudah ada lajur TAHUN_AKADEMIK
//   → data tahun lama kekal & ditapis secara automatik.
// - PERJUMPAAN, KEHADIRAN, LAPORAN_PERJUMPAAN, GAMBAR_LAPORAN
//   TIADA lajur tahun → WAJIB diarkibkan semasa tutup tahun.
//   (Jika tidak, kiraan kehadiran PAJSK tahun baru akan
//   tercemar dengan perjumpaan tahun lepas!)
// - Backup = salinan penuh fail Google Sheets ke folder
//   "Backup" dalam Drive sistem.

// ============================================
// STATUS
// ============================================

function getStatusArkib(token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin') return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();

  function bilRekod(namaSheet) {
    var sheet = ss.getSheetByName(namaSheet);
    if (!sheet) return 0;
    return Math.max(sheet.getLastRow() - 1, 0);
  }

  // Tahun-tahun dalam arkib
  var tahunArkib = [];
  var sheetArkib = ss.getSheetByName('ARKIB_PERJUMPAAN');
  if (sheetArkib && sheetArkib.getLastRow() > 1) {
    var set = {};
    sheetArkib.getDataRange().getValues().slice(1)
      .forEach(function(r) {
        if (r[5]) set[r[5]] = true;
      });
    tahunArkib = Object.keys(set).sort();
  }

  // Status trigger backup automatik
  var backupAuto = ScriptApp.getProjectTriggers()
    .some(function(t) {
      return t.getHandlerFunction() ===
        'backupAutoTrigger';
    });

  // Senarai backup dalam folder
  var senaraiBackup = [];
  var folderBackupUrl = '';
  try {
    var folder = dapatkanFolderBackup(tetapan);
    folderBackupUrl = folder.getUrl();
    var fail = folder.getFiles();
    while (fail.hasNext() &&
           senaraiBackup.length < 10) {
      var f = fail.next();
      senaraiBackup.push({
        nama: f.getName(),
        tarikh: f.getDateCreated()
          .toLocaleString('ms-MY'),
        url: f.getUrl()
      });
    }
    senaraiBackup.sort(function(a, b) {
      return b.nama.localeCompare(a.nama);
    });
  } catch(e) {}

  return {
    tahunSemasa: tetapan.TAHUN_AKADEMIK,
    bilPerjumpaan: bilRekod('PERJUMPAAN'),
    bilKehadiran: bilRekod('KEHADIRAN'),
    bilLaporan: bilRekod('LAPORAN_PERJUMPAAN'),
    tahunArkib: tahunArkib,
    backupAuto: backupAuto,
    senaraiBackup: senaraiBackup,
    folderBackupUrl: folderBackupUrl
  };
}

// ============================================
// TUTUP TAHUN AKADEMIK
// ============================================

/**
 * Tutup tahun akademik semasa dan mula tahun baru.
 * Langkah:
 *   1. Backup penuh spreadsheet (keselamatan)
 *   2. Pindahkan PERJUMPAAN, KEHADIRAN,
 *      LAPORAN_PERJUMPAAN, GAMBAR_LAPORAN
 *      → sheet ARKIB_* (dengan lajur TAHUN_AKADEMIK)
 *   3. Kemaskini TAHUN_AKADEMIK dalam TETAPAN
 * Data bertahun (KEAHLIAN, PAJSK dll) TIDAK disentuh —
 * ia kekal dan ditapis ikut tahun secara automatik.
 */
function tutupTahunAkademik(tahunBaru, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var tetapan = getTetapan();
    var tahunLama = tetapan.TAHUN_AKADEMIK.toString();
    tahunBaru = (tahunBaru || '').toString().trim();

    if (!/^\d{4}$/.test(tahunBaru)) {
      return { berjaya: false,
               mesej: 'Tahun baru tidak sah.' };
    }
    if (tahunBaru === tahunLama) {
      return { berjaya: false,
               mesej: 'Tahun baru sama dengan ' +
                 'tahun semasa.' };
    }

    // 1. Backup dulu (wajib)
    var namaBackup = buatSalinanBackup(
      'Sebelum_Tutup_Tahun_' + tahunLama, tetapan);

    // 2. Arkibkan sheet tanpa lajur tahun
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var bilArkib = {};

    bilArkib.perjumpaan = arkibkanSheet(ss,
      'PERJUMPAAN', 'ARKIB_PERJUMPAAN',
      ['ID_PERJUMPAAN', 'ID_KELAB', 'TARIKH',
       'MASA', 'TEMPAT'], tahunLama);

    bilArkib.kehadiran = arkibkanSheet(ss,
      'KEHADIRAN', 'ARKIB_KEHADIRAN',
      ['ID_PERJUMPAAN', 'IC', 'STATUS'], tahunLama);

    bilArkib.laporan = arkibkanSheet(ss,
      'LAPORAN_PERJUMPAAN', 'ARKIB_LAPORAN',
      ['ID_LAPORAN', 'ID_PERJUMPAAN', 'ID_KELAB',
       'TAJUK', 'AKTIVITI', 'NAMA_GURU',
       'TARIKH_HANTAR', 'PDF_URL'], tahunLama);

    bilArkib.gambar = arkibkanSheet(ss,
      'GAMBAR_LAPORAN', 'ARKIB_GAMBAR',
      ['ID_GAMBAR', 'ID_LAPORAN', 'NAMA_FAIL',
       'URL_DRIVE'], tahunLama);

    // 3. Kemaskini tahun akademik
    //    (kekalkan SEMUA kunci tetapan sedia ada)
    tetapan.TAHUN_AKADEMIK = tahunBaru;
    simpanTetapan(tetapan);

    logAktiviti(sesi.id, 'TUTUP_TAHUN',
      tahunLama + ' → ' + tahunBaru +
      ' | Arkib: P=' + bilArkib.perjumpaan +
      ' K=' + bilArkib.kehadiran +
      ' L=' + bilArkib.laporan);

    return {
      berjaya: true,
      tahunLama: tahunLama,
      tahunBaru: tahunBaru,
      bilArkib: bilArkib,
      namaBackup: namaBackup
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

/**
 * Pindahkan semua rekod dari sheet sumber ke sheet
 * arkib (tambah lajur TAHUN_AKADEMIK di hujung),
 * kemudian kosongkan sheet sumber (header kekal).
 * Pulangkan bilangan rekod diarkibkan.
 */
function arkibkanSheet(ss, namaSumber, namaArkib,
                        header, tahun) {
  var sumber = ss.getSheetByName(namaSumber);
  if (!sumber) return 0;

  var data = sumber.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0]; });
  if (data.length === 0) return 0;

  // Sedia sheet arkib
  var arkib = ss.getSheetByName(namaArkib);
  if (!arkib) {
    arkib = ss.insertSheet(namaArkib);
    var headerArkib = header.concat(['TAHUN_AKADEMIK']);
    arkib.getRange(1, 1, 1, headerArkib.length)
      .setValues([headerArkib]);
    arkib.getRange(1, 1, 1, headerArkib.length)
      .setBackground('#5f6368')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    arkib.setFrozenRows(1);
  }

  // Salin data + lajur tahun
  var baris = data.map(function(r) {
    return r.slice(0, header.length).concat([tahun]);
  });
  arkib.getRange(arkib.getLastRow() + 1, 1,
    baris.length, header.length + 1)
    .setValues(baris);

  // Kosongkan sumber (kekalkan header)
  sumber.getRange(2, 1,
    sumber.getLastRow() - 1,
    sumber.getLastColumn()).clearContent();

  return baris.length;
}

// ============================================
// BACKUP
// ============================================

function dapatkanFolderBackup(tetapan) {
  tetapan = tetapan || getTetapan();
  var folderRoot = DriveApp.getFolderById(
    tetapan.DRIVE_FOLDER_ID);
  var sub = folderRoot.getFoldersByName('Backup');
  if (sub.hasNext()) return sub.next();
  return folderRoot.createFolder('Backup');
}

/**
 * Buat salinan penuh spreadsheet ke folder Backup.
 * Pulangkan nama fail backup.
 */
function buatSalinanBackup(label, tetapan) {
  tetapan = tetapan || getTetapan();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fail = DriveApp.getFileById(ss.getId());
  var folder = dapatkanFolderBackup(tetapan);

  var cop = new Date();
  var timestamp = cop.getFullYear() + '-' +
    String(cop.getMonth() + 1).padStart(2, '0') + '-' +
    String(cop.getDate()).padStart(2, '0') + '_' +
    String(cop.getHours()).padStart(2, '0') +
    String(cop.getMinutes()).padStart(2, '0');

  var nama = 'Backup_Koku_' + timestamp +
    (label ? '_' + label : '');
  fail.makeCopy(nama, folder);
  return nama;
}

/** Backup manual dari halaman Admin. */
function buatBackupManual(token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var nama = buatSalinanBackup('Manual', null);
    logAktiviti(sesi.id, 'BACKUP_MANUAL', nama);
    return { berjaya: true, nama: nama };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

/**
 * Hidup / matikan backup automatik mingguan
 * (setiap Ahad 2 pagi, waktu skrip).
 */
function togolBackupAutomatik(aktif, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    // Padam trigger sedia ada
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() ===
          'backupAutoTrigger') {
        ScriptApp.deleteTrigger(t);
      }
    });

    if (aktif) {
      ScriptApp.newTrigger('backupAutoTrigger')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.SUNDAY)
        .atHour(2)
        .create();
    }

    logAktiviti(sesi.id, 'BACKUP_AUTO',
      aktif ? 'DIHIDUPKAN (mingguan)' : 'DIMATIKAN');
    return { berjaya: true, aktif: !!aktif };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

/**
 * Dipanggil oleh trigger automatik — TIADA token.
 * Buat backup dan kekalkan hanya 10 backup automatik
 * terkini (backup manual / tutup tahun tidak dipadam).
 */
function backupAutoTrigger() {
  try {
    var tetapan = getTetapan();
    buatSalinanBackup('Auto', tetapan);

    // Retention: padam backup Auto lama, simpan 10
    var folder = dapatkanFolderBackup(tetapan);
    var fail = folder.getFiles();
    var senaraiAuto = [];
    while (fail.hasNext()) {
      var f = fail.next();
      if (f.getName().indexOf('_Auto') !== -1) {
        senaraiAuto.push(f);
      }
    }
    senaraiAuto.sort(function(a, b) {
      return b.getDateCreated() - a.getDateCreated();
    });
    senaraiAuto.slice(10).forEach(function(f) {
      f.setTrashed(true);
    });

    logAktiviti('sistem', 'BACKUP_AUTO',
      'Backup mingguan berjaya');
  } catch(e) {
    logAktiviti('sistem', 'BACKUP_AUTO_RALAT',
      e.toString());
  }
}
