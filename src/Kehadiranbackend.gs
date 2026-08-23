// KehadiranBackend.gs

// Helper: google.script.run TIDAK boleh hantar objek
// Date ke browser — mesti tukar ke string dahulu.
function tarikhKeString(t) {
  if (!t) return '';
  if (Object.prototype.toString.call(t) ===
      '[object Date]') {
    return Utilities.formatDate(t,
      Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return t.toString();
}

function masaKeString(m) {
  if (!m) return '';
  if (Object.prototype.toString.call(m) ===
      '[object Date]') {
    return Utilities.formatDate(m,
      Session.getScriptTimeZone(), 'HH:mm');
  }
  return m.toString();
}


function getSenaraiKelab(token) {
  if (!semakSesi(token)) return null;
  var cache = cacheDapatkan('KELAB_AKTIF_V1');
  if (cache) return cache;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('KELAB');
  var data = sheet.getDataRange().getValues().slice(1);
  var hasil = data.filter(function(r) {
    return r[6] === 'AKTIF';
  }).map(function(r) {
    return { id: r[0], nama: r[1], kategori: r[2] };
  });
  cacheSimpan('KELAB_AKTIF_V1', hasil, 600);
  return hasil;
}

function buatPerjumpaan(data, token) {
  if (!semakSesi(token))
    return { berjaya: false, mesej: 'Sesi tamat.' };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PERJUMPAAN');
    var jumlah = sheet.getLastRow();
    var idBaru = 'P' + String(jumlah).padStart(4, '0');

    var bilAhli = populateKehadiran(idBaru,
      data.idKelab);

    sheet.appendRow([
      idBaru, data.idKelab,
      data.tarikh, data.masa, data.tempat,
      0, bilAhli
    ]);
    logAktiviti(semakSesi(token).id,
      'BUAT_PERJUMPAAN',
      'Kelab:' + data.idKelab +
      ' Tarikh:' + data.tarikh);

    return { berjaya: true, idPerjumpaan: idBaru };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function populateKehadiran(idPerjumpaan, idKelab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetKeahlian = ss.getSheetByName('KEAHLIAN');
  var sheetKehadiran = ss.getSheetByName('KEHADIRAN');
  var tetapan = getTetapan();

  // v3.3: semua ahli aktif diambil kehadiran
  // (dulu tersalah had kepada Tahun 4+ sahaja)
  var ahli = sheetKeahlian.getDataRange()
    .getValues().slice(1)
    .filter(function(r) {
      return r[1] === idKelab &&
             samaNilai(r[4], tetapan.TAHUN_AKADEMIK) &&
             r[5] === 'AKTIF';
    }).map(function(r) { return r[0]; });

  if (ahli.length > 0) {
    var baris = ahli.map(function(ic) {
      return [idPerjumpaan, ic, 'Tidak Hadir'];
    });
    var barisAkhir = sheetKehadiran.getLastRow() + 1;
    sheetKehadiran.getRange(barisAkhir, 1,
      baris.length, 3).setValues(baris);
  }
  return ahli.length;
}

function getKehadiran(idPerjumpaan, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetK = ss.getSheetByName('KEHADIRAN');
  var sheetM = ss.getSheetByName('MURID_MASTER');

  var muridMap = {};
  sheetM.getDataRange().getValues().slice(1)
    .forEach(function(r) {
      muridMap[r[0]] = { nama: r[1], kelasLabel: r[4] };
    });

  return sheetK.getDataRange().getValues().slice(1)
    .filter(function(r) {
      return r[0] === idPerjumpaan;
    }).map(function(r) {
      return {
        ic: r[1],
        nama: muridMap[r[1]] ?
          muridMap[r[1]].nama : r[1],
        kelas: muridMap[r[1]] ?
          muridMap[r[1]].kelasLabel : '',
        status: r[2]
      };
    }).sort(function(a, b) {
      return a.nama.localeCompare(b.nama);
    });
}

function simpanKehadiran(idPerjumpaan,
                          dataKehadiran, token) {
  if (!semakSesi(token))
    return { berjaya: false, mesej: 'Sesi tamat.' };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KEHADIRAN');
    var lastRow = sheet.getLastRow();
    if (lastRow < 2)
      return { berjaya: false,
               mesej: 'Tiada rekod kehadiran.' };

    // v3.3: cari blok baris perjumpaan (1 bacaan,
    // 1 tulisan) — bukan scan penuh setiap murid
    var colA = sheet.getRange(2, 1, lastRow - 1, 1)
      .getValues();
    var mula = -1, akhir = -1;
    for (var i = 0; i < colA.length; i++) {
      if (colA[i][0] === idPerjumpaan) {
        if (mula < 0) mula = i;
        akhir = i;
      }
    }
    if (mula < 0)
      return { berjaya: false,
               mesej: 'Perjumpaan tidak dijumpai.' };

    var peta = {};
    (dataKehadiran || []).forEach(function(it) {
      peta[String(it.ic).trim()] = it.status;
    });

    var blok = sheet.getRange(mula + 2, 1,
      akhir - mula + 1, 3).getValues();
    var hadir = 0, jumlah = 0;
    blok.forEach(function(r) {
      if (r[0] !== idPerjumpaan) return;
      var s = peta[String(r[1]).trim()];
      if (s !== undefined) r[2] = s;
      jumlah++;
      if (r[2] === 'Hadir') hadir++;
    });
    sheet.getRange(mula + 2, 3, blok.length, 1)
      .setValues(blok.map(function(r) {
        return [r[2]];
      }));

    kemaskiniKiraanPerjumpaan(idPerjumpaan,
      hadir, jumlah);

    logAktiviti(semakSesi(token).id,
      'SIMPAN_KEHADIRAN',
      'Perjumpaan:' + idPerjumpaan);
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function getPerjumpaanKelab(idKelab, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetP = ss.getSheetByName('PERJUMPAAN');
  var sheetL = ss.getSheetByName('LAPORAN_PERJUMPAAN');

  var idLaporan = sheetL.getDataRange().getValues()
    .slice(1).map(function(r) { return r[1]; });

  var semuaP = sheetP.getDataRange().getValues()
    .slice(1)
    .filter(function(r) { return r[1] === idKelab; });

  // v3.3: guna kiraan tersimpan (lajur 6-7).
  // Imbas KEHADIRAN penuh hanya jika ada rekod
  // lama tanpa kiraan.
  var perluImbas = semuaP.some(function(r) {
    return r[6] === undefined || r[6] === null ||
           r[6] === '';
  });
  var statK = {};
  if (perluImbas) {
    ss.getSheetByName('KEHADIRAN')
      .getDataRange().getValues().slice(1)
      .forEach(function(r) {
        if (!r[0]) return;
        if (!statK[r[0]]) statK[r[0]] = {
          hadir: 0, jumlah: 0
        };
        statK[r[0]].jumlah++;
        if (r[2] === 'Hadir') statK[r[0]].hadir++;
      });
  }

  return semuaP
    .map(function(r) {
      var st;
      if (r[6] !== undefined && r[6] !== null &&
          r[6] !== '') {
        st = { hadir: Number(r[5]) || 0,
               jumlah: Number(r[6]) || 0 };
      } else {
        st = statK[r[0]] || { hadir: 0, jumlah: 0 };
      }
      return {
        id: r[0],
        tarikh: tarikhKeString(r[2]),
        masa: masaKeString(r[3]),
        tempat: r[4],
        hadir: st.hadir,
        jumlah: st.jumlah,
        adaLaporan: idLaporan.includes(r[0])
      };
    }).sort(function(a, b) {
      return new Date(b.tarikh) - new Date(a.tarikh);
    });
}

function getStatKehadiran(ic, idKelab, token) {
  if (token && !semakSesi(token)) return null;
  return getStatKehadiranRaw(ic, idKelab);
}

function getStatKehadiranRaw(ic, idKelab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetP = ss.getSheetByName('PERJUMPAAN');
  var sheetK = ss.getSheetByName('KEHADIRAN');

  var perjumpaan = sheetP.getDataRange()
    .getValues().slice(1)
    .filter(function(r) { return r[1] === idKelab; });

  var kehadiran = sheetK.getDataRange()
    .getValues().slice(1)
    .filter(function(r) { return samaNilai(r[1], ic); });

  var jumlahPerjumpaan = perjumpaan.length;
  var jumlahHadir = kehadiran.filter(function(r) {
    return r[2] === 'Hadir';
  }).length;
  var jumlahBeralasan = kehadiran.filter(function(r) {
    return r[2] === 'Tidak Hadir Beralasan';
  }).length;
  var peratusan = jumlahPerjumpaan > 0 ?
    Math.round((jumlahHadir / jumlahPerjumpaan) * 100) : 0;

  // Jadual 10 Garis Panduan PAJSK KPM:
  // 3.33 markah setiap perjumpaan, 12 perjumpaan = 40 penuh
  var hadirUntukPAJSK = Math.min(jumlahHadir, 12);
  var markahKehadiran = hadirUntukPAJSK >= 12 ? 40 :
    Math.round(hadirUntukPAJSK * 3.33 * 100) / 100;

  return {
    jumlahPerjumpaan: jumlahPerjumpaan,
    jumlahHadir: jumlahHadir,
    jumlahBeralasan: jumlahBeralasan,
    jumlahTidakHadir: jumlahPerjumpaan -
      jumlahHadir - jumlahBeralasan,
    peratusan: peratusan,
    markahKehadiran: markahKehadiran
  };
}

/**
 * ADMIN SAHAJA: Padam perjumpaan berserta SEMUA data
 * berkaitan — rekod kehadiran, laporan, gambar dan PDF.
 */
function padamPerjumpaan(idPerjumpaan, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh memadam.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Padam laporan + gambar + PDF (jika ada)
    padamLaporanRaw(ss, idPerjumpaan);

    // 2. Padam rekod kehadiran
    var sheetK = ss.getSheetByName('KEHADIRAN');
    var rekodK = sheetK.getDataRange().getValues();
    for (var i = rekodK.length - 1; i >= 1; i--) {
      if (rekodK[i][0] === idPerjumpaan) {
        sheetK.deleteRow(i + 1);
      }
    }

    // 3. Padam perjumpaan
    var sheetP = ss.getSheetByName('PERJUMPAAN');
    var rekodP = sheetP.getDataRange().getValues();
    for (var j = rekodP.length - 1; j >= 1; j--) {
      if (rekodP[j][0] === idPerjumpaan) {
        sheetP.deleteRow(j + 1);
        logAktiviti(sesi.id, 'PADAM_PERJUMPAAN',
          'ID:' + idPerjumpaan);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Perjumpaan tidak dijumpai.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}


// v3.3: simpan kiraan hadir/jumlah dlm PERJUMPAAN
function kemaskiniKiraanPerjumpaan(id, hadir, jumlah) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('PERJUMPAAN');
    var sel = sheet.getRange(1, 1,
        sheet.getLastRow(), 1)
      .createTextFinder(id).matchEntireCell(true)
      .findNext();
    if (sel) {
      sheet.getRange(sel.getRow(), 6, 1, 2)
        .setValues([[hadir, jumlah]]);
    }
  } catch(e) {}
}
