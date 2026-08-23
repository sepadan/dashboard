// PencapaianBackend.gs

function tambahPencapaian(data, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PENCAPAIAN');
    var tetapan = getTetapan();

    // Sokong seorang atau ramai murid sekali gus
    var senaraiIC = data.senaraiIC ||
      (data.ic ? [data.ic] : []);
    if (senaraiIC.length === 0) {
      return { berjaya: false,
               mesej: 'Tiada murid dipilih.' };
    }

    var sheetMurid = ss.getSheetByName('MURID_MASTER');
    var icSah = {};
    sheetMurid.getDataRange().getValues().slice(1)
      .forEach(function(r) {
        if (r[0]) icSah[String(r[0]).trim()] = true;
      });

    var baris = [];
    var noMula = sheet.getLastRow();
    for (var i = 0; i < senaraiIC.length; i++) {
      var ic = String(senaraiIC[i]).trim();
      if (!icSah[ic]) {
        return {
          berjaya: false,
          mesej: 'IC murid tidak dijumpai: [' + ic + ']'
        };
      }
      baris.push([
        'CA' + String(noMula + i).padStart(4, '0'),
        ic, data.namaPertandingan,
        data.kategori, data.peringkat,
        data.tempat, data.jenispenglibatan,
        data.tarikh, data.guruPengiring,
        data.idKelab || '', tetapan.TAHUN_AKADEMIK
      ]);
    }

    sheet.getRange(sheet.getLastRow() + 1, 1,
      baris.length, 11).setValues(baris);

    logAktiviti(sesi.id, 'TAMBAH_PENCAPAIAN',
      senaraiIC.length + ' murid: ' +
      data.namaPertandingan);
    return { berjaya: true, bilangan: baris.length };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function getSenaraiPencapaian(filter, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetP = ss.getSheetByName('PENCAPAIAN');
  var sheetM = ss.getSheetByName('MURID_MASTER');
  var sheetK = ss.getSheetByName('KELAB');

  var muridMap = {};
  sheetM.getDataRange().getValues().slice(1)
    .forEach(function(r) {
      muridMap[r[0]] = { nama: r[1], kelas: r[4] };
    });

  var kelabMap = {};
  sheetK.getDataRange().getValues().slice(1)
    .forEach(function(r) { kelabMap[r[0]] = r[1]; });

  return sheetP.getDataRange().getValues().slice(1)
    .filter(function(r) {
      if (filter.ic && !samaNilai(r[1], filter.ic))
        return false;
      if (filter.peringkat && r[4] !== filter.peringkat)
        return false;
      if (filter.tahun && !samaNilai(r[10], filter.tahun))
        return false;
      if (filter.idKelab && r[9] !== filter.idKelab)
        return false;
      return true;
    }).map(function(r) {
      return {
        id: r[0], ic: r[1],
        namaMurid: muridMap[r[1]] ?
          muridMap[r[1]].nama : r[1],
        kelasMurid: muridMap[r[1]] ?
          muridMap[r[1]].kelas : '',
        namaPertandingan: r[2],
        kategori: r[3], peringkat: r[4],
        tempat: r[5], jenispenglibatan: r[6],
        tarikh: tarikhKeString(r[7]),
        guruPengiring: r[8],
        namaKelab: kelabMap[r[9]] || r[9],
        tahun: r[10]
      };
    }).sort(function(a, b) {
      return new Date(b.tarikh) - new Date(a.tarikh);
    });
}

function padamPencapaian(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh memadam.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PENCAPAIAN');
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        logAktiviti(sesi.id, 'PADAM_PENCAPAIAN',
          'ID:' + id);
        return { berjaya: true };
      }
    }
    return {
      berjaya: false,
      mesej: 'Rekod tidak dijumpai.'
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function getMarkahPencapaian(ic, idKelab, tahun) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PENCAPAIAN');
  var data = sheet.getDataRange().getValues().slice(1);

  var markahPencapaian = {
    'Antarabangsa': {
      'Johan': 20, 'Naib Johan': 19,
      'Ketiga': 18, 'Keempat': 17, 'Kelima': 16
    },
    'Kebangsaan': {
      'Johan': 17, 'Naib Johan': 16,
      'Ketiga': 15, 'Keempat': 14, 'Kelima': 13
    },
    'Negeri': {
      'Johan': 14, 'Naib Johan': 13,
      'Ketiga': 12, 'Keempat': 11, 'Kelima': 10
    },
    'Daerah': {
      'Johan': 11, 'Naib Johan': 10,
      'Ketiga': 9, 'Keempat': 8, 'Kelima': 7
    },
    'Sekolah': {
      'Johan': 8, 'Naib Johan': 7,
      'Ketiga': 6, 'Keempat': 5, 'Kelima': 4
    }
  };

  var markahTertinggi = 0;
  data.filter(function(r) {
    return samaNilai(r[1], ic) &&
           (r[9] === idKelab || !r[9]) &&
           samaNilai(r[10], tahun);
  }).forEach(function(r) {
    var peringkat = r[4];
    var tempat = r[5];
    var markah = markahPencapaian[peringkat] ?
      (markahPencapaian[peringkat][tempat] || 0) : 0;
    if (markah > markahTertinggi)
      markahTertinggi = markah;
  });

  return markahTertinggi;
}