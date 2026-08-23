// Murid.gs

function importMurid(csvText, token) {
  if (!semakSesi(token))
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    // Buang BOM & pecah baris (sokong CRLF Windows)
    var baris = csvText.replace(/^\uFEFF/, '')
      .trim().split(/\r?\n/);

    var IC_CAND = ['NO. PENGENALAN', 'NO PENGENALAN',
      'NO KP', 'NO. KP', 'MYKID', 'NO KAD', 'IC'];
    var NAMA_CAND = ['NAMA MURID', 'NAMA PENUH', 'NAMA'];

    // AUTO-KESAN baris header (fail iDMe ada baris
    // tajuk hiasan sebelum header sebenar)
    var idxHeader = -1;
    var header = null;
    var hadKesan = Math.min(baris.length, 20);
    for (var b = 0; b < hadKesan; b++) {
      var h = pecahCSV(baris[b]).map(function(x) {
        return x.trim().replace(/"/g, '');
      });
      if (cariIndeks(h, IC_CAND) !== -1 &&
          cariIndeks(h, NAMA_CAND) !== -1) {
        idxHeader = b;
        header = h;
        break;
      }
    }

    if (idxHeader === -1) {
      return {
        berjaya: false,
        mesej: 'Lajur IC/MyKid atau Nama tidak ' +
          'dijumpai dalam 20 baris pertama fail.'
      };
    }

    var idx = {
      ic: cariIndeks(header, IC_CAND),
      nama: cariIndeks(header, NAMA_CAND),
      tahun: cariIndeks(header,
        ['TAHUN / TINGKATAN', 'TAHUN', 'TINGKATAN']),
      kelas: cariIndeks(header,
        ['NAMA KELAS', 'KELAS']),
      jantina: cariIndeks(header,
        ['JANTINA', 'JENIS KELAMIN']),
      agama: cariIndeks(header, ['AGAMA']),
      kaum: cariIndeks(header, ['KAUM', 'BANGSA'])
    };

    // Peta tahun perkataan -> nombor (format iDMe)
    var petaTahun = {
      'PERALIHAN': '1',
      'SATU': '1', 'DUA': '2', 'TIGA': '3',
      'EMPAT': '4', 'LIMA': '5', 'ENAM': '6'
    };
    function prosesTahun(nilai) {
      var atas = (nilai || '').toUpperCase();
      for (var kunci in petaTahun) {
        if (atas.indexOf(kunci) !== -1)
          return petaTahun[kunci];
      }
      return atas.replace(/\D/g, '');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('MURID_MASTER');
    var dataSedia = sheet.getDataRange().getValues()
      .slice(1);
    var icSedia = {};
    dataSedia.forEach(function(r, i) {
      if (r[0]) icSedia[r[0].toString().trim()] = i + 2;
    });

    var icDalamCSV = {};
    var jumlahTambah = 0;
    var jumlahKemaskini = 0;
    var jumlahLangkau = 0;
    var senaraiBaris = [];

    for (var i = idxHeader + 1; i < baris.length; i++) {
      var lajur = pecahCSV(baris[i]);
      if (!lajur || lajur.length < 2) continue;

      var ic = (lajur[idx.ic] || '').trim()
        .replace(/"/g, '');
      var nama = (lajur[idx.nama] || '').trim()
        .replace(/"/g, '');
      if (!ic || !nama) continue;

      // Langkau prasekolah & pendidikan khas
      // (bukan skop sistem koku)
      var tahunRaw = idx.tahun !== -1 ?
        (lajur[idx.tahun] || '') : '';
      var namaKelas = idx.kelas !== -1 ?
        (lajur[idx.kelas] || '').trim()
          .replace(/"/g, '') : '';
      var saring = (tahunRaw + ' ' + namaKelas)
        .toUpperCase();
      if (tahunRaw.toUpperCase().indexOf('PRA') !== -1 ||
          /(^|[^A-Z])(KHAS|PPKI|PKBP|INTEGRASI)([^A-Z]|$)/
            .test(saring)) {
        jumlahLangkau++;
        continue;
      }

      icDalamCSV[ic] = true;

      var tahun = prosesTahun(tahunRaw);
      var kelasLabel = tahun ?
        tahun + ' ' + namaKelas : namaKelas;
      var jantina = idx.jantina !== -1 ?
        (lajur[idx.jantina] || '').trim()
          .replace(/"/g, '') : '';
      var agama = idx.agama !== -1 ?
        (lajur[idx.agama] || '').trim()
          .replace(/"/g, '') : '';
      var kaum = idx.kaum !== -1 ?
        (lajur[idx.kaum] || '').trim()
          .replace(/"/g, '') : '';
      var tarikhKini =
        new Date().toLocaleDateString('ms-MY');

      if (icSedia[ic]) {
        var noRow = icSedia[ic];
        sheet.getRange(noRow, 1, 1, 10).setValues([[
          ic, nama, tahun, namaKelas, kelasLabel,
          jantina, agama, kaum, 'AKTIF', tarikhKini
        ]]);
        jumlahKemaskini++;
      } else {
        senaraiBaris.push([
          ic, nama, tahun, namaKelas, kelasLabel,
          jantina, agama, kaum, 'AKTIF', tarikhKini
        ]);
        jumlahTambah++;
      }
    }

    if (senaraiBaris.length > 0) {
      var barisAkhir = sheet.getLastRow() + 1;
      sheet.getRange(barisAkhir, 1,
        senaraiBaris.length, 10)
           .setValues(senaraiBaris);
    }

    var jumlahTidakAktif = 0;
    var dataTerkini = sheet.getDataRange().getValues()
      .slice(1);
    dataTerkini.forEach(function(r, i) {
      var icR = r[0] ? r[0].toString().trim() : '';
      if (icR && !icDalamCSV[icR] && r[8] === 'AKTIF') {
        sheet.getRange(i + 2, 9).setValue('TIDAK AKTIF');
        jumlahTidakAktif++;
      }
    });

    logAktiviti('sistem', 'IMPORT_MURID',
      'Tambah:' + jumlahTambah +
      ' Kemaskini:' + jumlahKemaskini +
      ' TidakAktif:' + jumlahTidakAktif +
      ' LangkauPra:' + jumlahLangkau);

    cacheBuang('KELAS_AKTIF_V1');
    return {
      berjaya: true,
      tambah: jumlahTambah,
      kemaskini: jumlahKemaskini,
      tidakAktif: jumlahTidakAktif,
      langkau: jumlahLangkau
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function exportTemplateKoku(token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MURID_MASTER');
  var data = sheet.getDataRange().getValues().slice(1);

  var csv = 'IC,NAMA,KELAS,UNIT,KELAB,SUKAN,RUMAH\n';

  var muridAktif = data
    .filter(function(r) { return r[8] === 'AKTIF'; })
    .sort(function(a, b) {
      // 1. Tahun (1-6)
      var tA = parseInt(a[2]) || 0;
      var tB = parseInt(b[2]) || 0;
      if (tA !== tB) return tA - tB;
      // 2. Nama kelas (BIJAK, CERDIK, ...)
      var kA = (a[3] || '').toString();
      var kB = (b[3] || '').toString();
      if (kA !== kB) return kA.localeCompare(kB);
      // 3. Nama murid (abjad)
      return a[1].localeCompare(b[1]);
    });

  muridAktif.forEach(function(r) {
    var ic = r[0] || '';
    var nama = r[1] || '';
    var kelas = r[4] || '';
    // ="..." supaya Excel TIDAK tukar IC kepada
    // notasi saintifik (cth: 1.9042E+11)
    csv += '="' + ic + '","' + nama + '","' +
      kelas + '",,,,\n';
  });

  return csv;
}

function importKeahlian(csvText, token) {
  if (!semakSesi(token))
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var baris = csvText.trim().split('\n');
    var header = baris[0].split(',').map(function(h) {
      return h.trim().replace(/"/g, '');
    });

    var idx = {
      ic: cariIndeks(header,
        ['IC', 'NO KP', 'MYKID']),
      nama: cariIndeks(header,
        ['NAMA MURID', 'NAMA']),
      kelas: cariIndeks(header,
        ['KELAS']),
      unit: cariIndeks(header, ['UNIT']),
      kelab: cariIndeks(header, ['KELAB']),
      sukan: cariIndeks(header, ['SUKAN']),
      rumah: cariIndeks(header, ['RUMAH'])
    };

    if (idx.ic === -1) {
      return {
        berjaya: false,
        mesej: 'Lajur IC tidak dijumpai.'
      };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetMurid = ss.getSheetByName('MURID_MASTER');
    var sheetKeahlian = ss.getSheetByName('KEAHLIAN');
    var sheetKelab = ss.getSheetByName('KELAB');
    var tetapan = getTetapan();
    var tahunAkademik = tetapan.TAHUN_AKADEMIK;

    var dataMurid = sheetMurid.getDataRange()
      .getValues().slice(1);
    var icMurid = {};
    var namaMap = {};
    dataMurid.filter(function(r) {
      return r[8] === 'AKTIF';
    }).forEach(function(r) {
      if (!r[0]) return;
      icMurid[r[0].toString().trim()] = true;
      var kunci = (r[1] || '').toString()
        .trim().toUpperCase();
      if (!namaMap[kunci]) namaMap[kunci] = [];
      namaMap[kunci].push({
        ic: r[0].toString().trim(),
        kelas: (r[4] || '').toString()
          .trim().toUpperCase()
      });
    });

    var dataKelab = sheetKelab.getDataRange()
      .getValues().slice(1);
    var kelabMap = {};
    dataKelab.forEach(function(r) {
      if (r[1]) kelabMap[r[1].toString().trim()
        .toUpperCase()] = r[0];
    });

    var dataKeahlianSedia = sheetKeahlian.getDataRange()
      .getValues().slice(1);
    var barisKekal = dataKeahlianSedia.filter(function(r) {
      return r[4] !== tahunAkademik;
    });

    sheetKeahlian.clearContents();
    sheetKeahlian.getRange(1, 1, 1, 6).setValues([[
      'IC', 'ID_KELAB', 'KATEGORI', 'JAWATAN',
      'TAHUN_AKADEMIK', 'STATUS'
    ]]);

    if (barisKekal.length > 0) {
      sheetKeahlian.getRange(2, 1,
        barisKekal.length, 6).setValues(barisKekal);
    }

    var jumlahBerjaya = 0;
    var jumlahRalat = 0;
    var kokuBaruBaris = [];
    var kokuBaruNama = [];
    var kokuBaruBil = 0;
    var senaraiRalat = [];
    var barisBaru = [];

    for (var i = 1; i < baris.length; i++) {
      var lajur = pecahCSV(baris[i]);
      if (!lajur || lajur.length < 2) continue;

      var ic = (lajur[idx.ic] || '').trim()
        .replace(/"/g, '').replace(/^=/, '');
      var namaRow = idx.nama !== -1 ?
        (lajur[idx.nama] || '').trim()
          .replace(/"/g, '') : '';
      var kelasRow = idx.kelas !== -1 ?
        (lajur[idx.kelas] || '').trim()
          .replace(/"/g, '') : '';
      if (!ic && !namaRow) continue;

      if (!icMurid[ic]) {
        // IC tidak sah (mungkin dirosakkan Excel,
        // cth 1.9042E+11) — cuba padan ikut NAMA,
        // dan KELAS jika nama berganda
        var calon = namaMap[namaRow.toUpperCase()] || [];
        if (calon.length > 1 && kelasRow) {
          calon = calon.filter(function(c) {
            return c.kelas === kelasRow.toUpperCase();
          });
        }
        if (calon.length === 1) {
          ic = calon[0].ic;
        } else {
          senaraiRalat.push('Baris ' + (i + 1) + ': "' +
            (namaRow || ic) +
            '" tidak dapat dipadankan' +
            (calon.length > 1 ? ' (nama berganda)' : ''));
          jumlahRalat++;
          continue;
        }
      }

      var kategoriMap = [
        { key: 'unit', label: 'Unit Beruniform' },
        { key: 'kelab', label: 'Kelab & Persatuan' },
        { key: 'sukan', label: 'Sukan & Permainan' },
        { key: 'rumah', label: 'Rumah Sukan' }
      ];

      kategoriMap.forEach(function(kat) {
        if (idx[kat.key] === -1) return;
        var namaKelab = (lajur[idx[kat.key]] || '')
          .trim().replace(/"/g, '').toUpperCase();
        if (!namaKelab) return;

        var idKelab = kelabMap[namaKelab];
        if (!idKelab) {
          // v3.8: daftar koku baru secara automatik
          // ikut kategori lajur CSV
          idKelab = 'K' + Date.now() + '_' +
            (kokuBaruBil++);
          kelabMap[namaKelab] = idKelab;
          kokuBaruBaris.push([idKelab, namaKelab,
            kat.label, '', '', '', 'AKTIF']);
          kokuBaruNama.push(namaKelab +
            ' (' + kat.label + ')');
        }

        barisBaru.push([
          ic, idKelab, kat.label,
          'Ahli Biasa', tahunAkademik, 'AKTIF'
        ]);
        jumlahBerjaya++;
      });
    }

    if (barisBaru.length > 0) {
      var barisAkhir = sheetKeahlian.getLastRow() + 1;
      sheetKeahlian.getRange(barisAkhir, 1,
        barisBaru.length, 6).setValues(barisBaru);
    }

    logAktiviti('sistem', 'IMPORT_KEAHLIAN',
      'Berjaya:' + jumlahBerjaya +
      ' Ralat:' + jumlahRalat);

    // Tulis koku baru ke sheet KELAB (satu tulisan)
    if (kokuBaruBaris.length > 0) {
      var barisKelab = sheetKelab.getLastRow() + 1;
      sheetKelab.getRange(barisKelab, 1,
        kokuBaruBaris.length, 7)
        .setValues(kokuBaruBaris);
      cacheBuang('KELAB_AKTIF_V1');
    }

    return {
      berjaya: true,
      jumlahBerjaya: jumlahBerjaya,
      jumlahRalat: jumlahRalat,
      kokuBaru: kokuBaruNama,
      senaraiBaris: senaraiRalat.slice(0, 10)
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function getSenaraiMurid(filter, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MURID_MASTER');
  var data = sheet.getDataRange().getValues().slice(1);

  return data.filter(function(r) {
    if (filter.status && r[8] !== filter.status)
      return false;
    if (filter.tahun && r[2] !== filter.tahun)
      return false;
    if (filter.kelas && r[3] !== filter.kelas)
      return false;
    if (filter.carian) {
      var carian = filter.carian.toLowerCase();
      var nama = (r[1] || '').toLowerCase();
      var ic = (r[0] || '').toString();
      if (!nama.includes(carian) && !ic.includes(carian))
        return false;
    }
    return true;
  }).map(function(r) {
    return {
      ic: r[0], nama: r[1], tahun: r[2],
      kelas: r[3], kelasLabel: r[4],
      jantina: r[5], status: r[8]
    };
  });
}

function cariIndeks(header, kemungkinan) {
  for (var k = 0; k < kemungkinan.length; k++) {
    for (var i = 0; i < header.length; i++) {
      if (header[i].toUpperCase().includes(
          kemungkinan[k].toUpperCase())) {
        return i;
      }
    }
  }
  return -1;
}

function pecahCSV(baris) {
  var hasil = [];
  var semasa = '';
  var dalamPetikan = false;
  for (var i = 0; i < baris.length; i++) {
    var c = baris[i];
    if (c === '"') {
      dalamPetikan = !dalamPetikan;
    } else if (c === ',' && !dalamPetikan) {
      hasil.push(semasa);
      semasa = '';
    } else {
      semasa += c;
    }
  }
  hasil.push(semasa);
  return hasil;
}