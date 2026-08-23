// KelabBackend.gs

function getSenaraiKelabPenuh(token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('KELAB');
  var data = sheet.getDataRange().getValues().slice(1);
  return data.filter(function(r) {
    return r[0];
  }).map(function(r) {
    return {
      id: r[0], nama: r[1], kategori: r[2],
      jenis: r[3], guru1: r[4], guru2: r[5],
      status: r[6]
    };
  });
}

function tambahKelab(data, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues()
      .slice(1);

    // Semak nama duplicate
    var namaBaru = data.nama.trim().toUpperCase();
    var wujud = rekod.filter(function(r) {
      return r[1] &&
        r[1].toString().trim().toUpperCase() ===
        namaBaru;
    })[0];
    if (wujud) {
      return {
        berjaya: false,
        mesej: 'Kelab "' + data.nama +
          '" sudah wujud.'
      };
    }

    var idBaru = 'K' + new Date().getTime();
    sheet.appendRow([
      idBaru, namaBaru, data.kategori,
      data.jenis || '', data.guru1 || '',
      data.guru2 || '', 'AKTIF'
    ]);

    cacheBuang('KELAB_AKTIF_V1');
    logAktiviti(sesi.id, 'TAMBAH_KELAB',
      'Kelab: ' + namaBaru);
    return { berjaya: true, id: idBaru };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function editKelab(id, data, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[
          data.nama.trim().toUpperCase(),
          data.kategori,
          data.jenis || '',
          data.guru1 || '',
          data.guru2 || '',
          data.status || 'AKTIF'
        ]]);
        cacheBuang('KELAB_AKTIF_V1');
        logAktiviti(sesi.id, 'EDIT_KELAB',
          'ID: ' + id);
        return { berjaya: true };
      }
    }
    return {
      berjaya: false,
      mesej: 'Kelab tidak dijumpai.'
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function togolStatusKelab(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        var statusBaru = rekod[i][6] === 'AKTIF' ?
          'TIDAK AKTIF' : 'AKTIF';
        sheet.getRange(i + 1, 7).setValue(statusBaru);
        cacheBuang('KELAB_AKTIF_V1');
        logAktiviti(sesi.id, 'TOGOL_KELAB',
          'ID: ' + id + ' → ' + statusBaru);
        return { berjaya: true, status: statusBaru };
      }
    }
    return {
      berjaya: false,
      mesej: 'Kelab tidak dijumpai.'
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function tambahGuru(nama, jawatan, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('GURU');
    var idBaru = 'G' + new Date().getTime();
    sheet.appendRow([idBaru, nama.trim(),
      jawatan || '']);
    logAktiviti(sesi.id, 'TAMBAH_GURU',
      'Guru: ' + nama);
    return { berjaya: true, id: idBaru };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function padamGuru(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('GURU');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.deleteRow(i + 1);
        logAktiviti(sesi.id, 'PADAM_GURU',
          'ID: ' + id);
        return { berjaya: true };
      }
    }
    return {
      berjaya: false,
      mesej: 'Guru tidak dijumpai.'
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

/**
 * ADMIN SAHAJA: Padam koku secara kekal.
 * Disekat jika masih ada data keahlian atau
 * perjumpaan berkaitan (guna Nyahaktif untuk itu).
 */
function padamKelab(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh memadam.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Semak data berkaitan
    var adaKeahlian = ss.getSheetByName('KEAHLIAN')
      .getDataRange().getValues().slice(1)
      .some(function(r) { return r[1] === id; });
    var adaPerjumpaan = ss.getSheetByName('PERJUMPAAN')
      .getDataRange().getValues().slice(1)
      .some(function(r) { return r[1] === id; });

    if (adaKeahlian || adaPerjumpaan) {
      return {
        berjaya: false,
        mesej: 'Tidak boleh dipadam — masih ada data ' +
          (adaKeahlian ? 'keahlian' : '') +
          (adaKeahlian && adaPerjumpaan ? ' dan ' : '') +
          (adaPerjumpaan ? 'perjumpaan' : '') +
          ' berkaitan. Gunakan Nyahaktif.'
      };
    }

    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();
    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.deleteRow(i + 1);
        logAktiviti(sesi.id, 'PADAM_KELAB', 'ID:' + id);
        cacheBuang('KELAB_AKTIF_V1');
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Rekod tidak dijumpai.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}


/**
 * TUKAR JENIS KOKU (v4.0, admin sahaja)
 * Jenis menentukan jadual jawatan PAJSK yang
 * digunakan (cth: Pengakap, PBSM). 'Umum' =
 * jadual jawatan lalai.
 */
function tukarJenisKelab(id, jenis, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();
    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.getRange(i + 1, 4)
          .setValue(jenis === 'Umum' ? '' : jenis);
        logAktiviti(sesi.id, 'TUKAR_JENIS_KOKU',
          'ID: ' + id + ' → ' + jenis);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Koku tidak dijumpai.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}


/**
 * IMPORT GURU PUKAL (v4.3, admin sahaja)
 * Terima array nama; langkau nama yang sudah wujud.
 */
function importGuru(senaraiNama, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('GURU');
    var sedia = {};
    sheet.getDataRange().getValues().slice(1)
      .forEach(function(r) {
        if (r[1]) sedia[r[1].toString().trim()
          .toUpperCase()] = true;
      });

    var baris = [];
    var langkau = 0;
    var asas = new Date().getTime();
    (senaraiNama || []).forEach(function(nama, i) {
      nama = String(nama).trim().toUpperCase();
      if (!nama) return;
      if (sedia[nama]) { langkau++; return; }
      sedia[nama] = true;
      baris.push(['G' + (asas + i), nama, '']);
    });

    if (baris.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1,
        baris.length, 3).setValues(baris);
    }
    logAktiviti(sesi.id, 'IMPORT_GURU',
      'Tambah:' + baris.length +
      ' Langkau:' + langkau);
    return { berjaya: true, tambah: baris.length,
             langkau: langkau };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}
