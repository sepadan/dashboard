// LaporanBackend.gs

function simpanLaporan(data, gambar,
                        gambarBuang, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetL = ss.getSheetByName('LAPORAN_PERJUMPAAN');
    var sheetG = ss.getSheetByName('GAMBAR_LAPORAN');
    var tetapan = getTetapan();

    // KAWALAN: kehadiran mesti diisi dahulu
    // (sekurang-kurangnya 1 murid hadir)
    var adaHadir = ss.getSheetByName('KEHADIRAN')
      .getDataRange().getValues().slice(1)
      .some(function(r) {
        return r[0] === data.idPerjumpaan &&
               r[2] === 'Hadir';
      });
    if (!adaHadir) {
      return {
        berjaya: false,
        mesej: 'Sila isi kehadiran dahulu sebelum ' +
          'menghantar laporan.'
      };
    }

    // Semak laporan sedia ada untuk perjumpaan ini
    // (edit = kemaskini baris sama, BUKAN baris baru)
    var rekodL = sheetL.getDataRange().getValues();
    var barisSedia = -1;
    var idLaporan = '';
    var pdfLama = '';
    for (var i = 1; i < rekodL.length; i++) {
      if (rekodL[i][1] === data.idPerjumpaan) {
        barisSedia = i + 1;
        idLaporan = rekodL[i][0];
        pdfLama = rekodL[i][7] || '';
        break;
      }
    }
    if (!idLaporan) {
      idLaporan = 'L' + String(sheetL.getLastRow())
        .padStart(4, '0');
    }

    // Padam gambar yang ditanda buang oleh guru
    // (baris sheet + fail Drive)
    if (gambarBuang && gambarBuang.length > 0 &&
        idLaporan) {
      var rekodG0 = sheetG.getDataRange().getValues();
      for (var g = rekodG0.length - 1; g >= 1; g--) {
        if (rekodG0[g][1] === idLaporan &&
            gambarBuang.indexOf(rekodG0[g][0]) !== -1) {
          try {
            var mG = (rekodG0[g][3] || '')
              .match(/[-\w]{25,}/);
            if (mG) DriveApp.getFileById(mG[0])
              .setTrashed(true);
          } catch(eB) {}
          sheetG.deleteRow(g + 1);
        }
      }
    }

    // Bilangan gambar sedia ada (untuk nombor ID unik)
    var rekodG = sheetG.getDataRange().getValues()
      .slice(1);
    var bilSedia = rekodG.filter(function(r) {
      return r[1] === idLaporan;
    }).length;

    // Had keselamatan server: maksimum 4 gambar
    // setiap laporan (termasuk sedia ada)
    if (gambar && gambar.length > 0) {
      var bakiSlot = Math.max(4 - bilSedia, 0);
      gambar = gambar.slice(0, bakiSlot);
    }

    // Simpan gambar BARU (gambar lama kekal)
    if (gambar && gambar.length > 0) {
      var folderGambar = dapatkanFolderGambar(
        data.idKelab, tetapan
      );
      gambar.forEach(function(g, i) {
        var blob = Utilities.newBlob(
          Utilities.base64Decode(g.data),
          g.jenis, g.nama
        );
        var fail = folderGambar.createFile(blob);
        fail.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW
        );
        var idGambar = idLaporan + '_G' +
          (bilSedia + i + 1);
        sheetG.appendRow([
          idGambar, idLaporan,
          g.nama, fail.getUrl()
        ]);
      });
    }

    // Senarai penuh gambar laporan ini (lama + baru)
    var senaraiGambar = sheetG.getDataRange().getValues()
      .slice(1)
      .filter(function(r) { return r[1] === idLaporan; })
      .map(function(r) {
        return { nama: r[2], url: r[3] };
      });

    var pdfUrl = generatePDFLaporan(
      data, tetapan, senaraiGambar
    );

    var barisData = [
      idLaporan, data.idPerjumpaan,
      data.idKelab, data.tajuk,
      data.aktiviti, data.namaGuru,
      new Date().toLocaleDateString('ms-MY'),
      pdfUrl
    ];

    if (barisSedia > 0) {
      sheetL.getRange(barisSedia, 1, 1, 8)
        .setValues([barisData]);
      // Padam PDF lama supaya Drive tidak berlonggok
      if (pdfLama && pdfLama !== pdfUrl) {
        try {
          var mL = pdfLama.match(/[-\w]{25,}/);
          if (mL) DriveApp.getFileById(mL[0])
            .setTrashed(true);
        } catch(e2) {}
      }
    } else {
      sheetL.appendRow(barisData);
    }

    logAktiviti(sesi.id, 'SIMPAN_LAPORAN',
      'Laporan:' + idLaporan +
      (barisSedia > 0 ? ' (edit)' : ' (baru)'));
    return { berjaya: true, idLaporan: idLaporan };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function dapatkanFolderGambar(idKelab, tetapan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetKelab = ss.getSheetByName('KELAB');
  var dataKelab = sheetKelab.getDataRange()
    .getValues().slice(1);
  var kelab = dataKelab.filter(function(r) {
    return r[0] === idKelab;
  })[0];
  var namaKelab = kelab ? kelab[1] : idKelab;
  var tahun = tetapan.TAHUN_AKADEMIK;

  var folderRoot = DriveApp.getFolderById(
    tetapan.DRIVE_FOLDER_ID
  );
  var folderGambar = dapatkanAtauCiptaFolder(
    folderRoot, 'Gambar Aktiviti'
  );
  var folderTahun = dapatkanAtauCiptaFolder(
    folderGambar, tahun
  );
  return dapatkanAtauCiptaFolder(folderTahun, namaKelab);
}

function dapatkanAtauCiptaFolder(parent, nama) {
  var iterator = parent.getFoldersByName(nama);
  if (iterator.hasNext()) return iterator.next();
  return parent.createFolder(nama);
}

function generatePDFLaporan(data, tetapan,
                             senaraiGambar) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var sheetP = ss.getSheetByName('PERJUMPAAN');
    var perjumpaan = sheetP.getDataRange()
      .getValues().slice(1)
      .filter(function(r) {
        return r[0] === data.idPerjumpaan;
      })[0];

    var sheetK = ss.getSheetByName('KELAB');
    var kelab = sheetK.getDataRange()
      .getValues().slice(1)
      .filter(function(r) {
        return r[0] === data.idKelab;
      })[0];

    var sheetKH = ss.getSheetByName('KEHADIRAN');
    var rekodKehadiran = sheetKH.getDataRange()
      .getValues().slice(1)
      .filter(function(r) {
        return r[0] === data.idPerjumpaan;
      });

    var bilHadir = rekodKehadiran.filter(function(r) {
      return r[2] === 'Hadir';
    }).length;
    var bilTidakHadir = rekodKehadiran.filter(function(r) {
      return r[2] !== 'Hadir';
    }).length;

    var tarikhP = perjumpaan ?
      new Date(perjumpaan[2])
        .toLocaleDateString('ms-MY') : '';

    // ===== REKA LETAK SATU MUKA SURAT (A4) =====
    function esc(t) {
      return (t === null || t === undefined ? '' : t)
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Saiz fon aktiviti auto ikut panjang teks
    var teksAktiviti = (data.aktiviti || '').toString();
    var fonAktiviti = teksAktiviti.length <= 350 ?
      '11pt' : (teksAktiviti.length <= 650 ?
      '10pt' : '9pt');
    var aktivitiHtml = esc(teksAktiviti)
      .replace(/\n/g, '<br>');

    // Grid gambar 2 lajur (max 4)
    var htmlGambar = '';
    if (senaraiGambar && senaraiGambar.length > 0) {
      var srcGambar = [];
      senaraiGambar.slice(0, 4).forEach(function(g) {
        try {
          var mID = (g.url || '').match(/[-\w]{25,}/);
          if (!mID) return;
          var blobG = DriveApp.getFileById(mID[0])
            .getBlob();
          srcGambar.push('data:' +
            blobG.getContentType() + ';base64,' +
            Utilities.base64Encode(blobG.getBytes()));
        } catch(eG) {}
      });
      if (srcGambar.length > 0) {
        var tinggiImg = srcGambar.length <= 2 ?
          '62mm' : '48mm';
        htmlGambar =
          '<div class="label">GAMBAR AKTIVITI</div>' +
          '<table class="grid-gambar"><tr>';
        srcGambar.forEach(function(src, i) {
          if (i === 2) htmlGambar += '</tr><tr>';
          htmlGambar += '<td><img src="' + src +
            '" style="max-height:' + tinggiImg +
            '"></td>';
        });
        if (srcGambar.length === 1 ||
            srcGambar.length === 3) {
          htmlGambar += '<td></td>';
        }
        htmlGambar += '</tr></table>';
      }
    }

    var htmlKandungan =
      '<html><head><style>' +
      '@page{size:A4 portrait;margin:12mm 15mm;}' +
      'body{font-family:Arial,sans-serif;margin:0;' +
      'color:#1a1a1a;}' +
      '.kepala{text-align:center;' +
      'border-bottom:3px double #000;' +
      'padding-bottom:6px;margin-bottom:10px;}' +
      '.kepala h1{font-size:14pt;margin:0;' +
      'letter-spacing:1px;}' +
      '.kepala h2{font-size:11pt;margin:3px 0 0 0;' +
      'font-weight:normal;}' +
      'table.info{width:100%;border-collapse:collapse;' +
      'margin-bottom:8px;}' +
      'table.info td{font-size:10pt;padding:4px 7px;' +
      'border:1px solid #aaa;}' +
      'table.info td.k{width:34mm;background:#f2f2f2;' +
      'font-weight:bold;}' +
      '.label{font-size:10pt;font-weight:bold;' +
      'margin:7px 0 3px 0;}' +
      '.aktiviti{border:1px solid #aaa;' +
      'padding:6px 9px;font-size:' + fonAktiviti + ';' +
      'line-height:1.35;min-height:55px;}' +
      'table.grid-gambar{width:100%;' +
      'border-collapse:collapse;margin-top:2px;}' +
      'table.grid-gambar td{width:50%;' +
      'text-align:center;padding:2mm;' +
      'border:1px solid #ddd;vertical-align:middle;}' +
      'table.grid-gambar img{max-width:100%;}' +
      'table.ttd{width:100%;margin-top:9mm;' +
      'border-collapse:collapse;}' +
      'table.ttd td{font-size:10pt;' +
      'vertical-align:bottom;}' +
      '.garis-ttd{border-top:1px solid #000;' +
      'width:62mm;padding-top:4px;' +
      'text-align:center;}' +
      '</style></head><body>' +
      '<div class="kepala">' +
      '<h1>' + esc(tetapan.NAMA_SEKOLAH) + '</h1>' +
      '<h2>LAPORAN PERJUMPAAN KOKURIKULUM ' +
      esc(tetapan.TAHUN_AKADEMIK) + '</h2>' +
      '</div>' +
      '<table class="info">' +
      '<tr><td class="k">Nama</td><td>' +
      esc(kelab ? kelab[1] : '') + '</td>' +
      '<td class="k">Kategori</td><td>' +
      esc(kelab ? kelab[2] : '') + '</td></tr>' +
      '<tr><td class="k">Tarikh</td><td>' +
      esc(tarikhP) + '</td>' +
      '<td class="k">Tempat</td><td>' +
      esc(perjumpaan ? perjumpaan[4] : '') +
      '</td></tr>' +
      '<tr><td class="k">Tajuk</td>' +
      '<td colspan="3">' + esc(data.tajuk) +
      '</td></tr>' +
      '<tr><td class="k">Bil. Hadir</td><td>' +
      bilHadir + ' orang</td>' +
      '<td class="k">Bil. Tidak Hadir</td><td>' +
      bilTidakHadir + ' orang</td></tr>' +
      '</table>' +
      '<div class="label">AKTIVITI</div>' +
      '<div class="aktiviti">' + aktivitiHtml +
      '</div>' +
      htmlGambar +
      '<div class="label">GURU PENASIHAT</div>' +
      '<div class="aktiviti" style="min-height:0">' +
      esc(data.namaGuru).split(',').map(function(n, i) {
        return (i + 1) + '. ' + n.trim();
      }).join('<br>') +
      '</div>' +
      '</body></html>';

    var folderRoot = DriveApp.getFolderById(
      tetapan.DRIVE_FOLDER_ID
    );
    var folderLaporan = dapatkanAtauCiptaFolder(
      folderRoot, 'Laporan Perjumpaan'
    );
    var folderTahun = dapatkanAtauCiptaFolder(
      folderLaporan, tetapan.TAHUN_AKADEMIK
    );
    var namaKelab = kelab ? kelab[1] : data.idKelab;
    var folderKelab = dapatkanAtauCiptaFolder(
      folderTahun, namaKelab
    );

    var tarikhFail = tarikhP.replace(/\//g, '-');
    var namaPDF = 'Laporan_' + namaKelab +
      '_' + tarikhFail + '.pdf';

    var blob = Utilities.newBlob(
      htmlKandungan, 'text/html', namaPDF
    ).getAs('application/pdf').setName(namaPDF);

    var fail = folderKelab.createFile(blob);
    fail.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );
    return fail.getUrl();
  } catch(e) {
    return '';
  }
}

function getLaporan(idPerjumpaan, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('LAPORAN_PERJUMPAAN');
  var data = sheet.getDataRange().getValues().slice(1);
  var laporan = data.filter(function(r) {
    return r[1] === idPerjumpaan;
  })[0];
  if (!laporan) return null;
  var gambar = ss.getSheetByName('GAMBAR_LAPORAN')
    .getDataRange().getValues().slice(1)
    .filter(function(r) { return r[1] === laporan[0]; })
    .map(function(r) {
      return { id: r[0], nama: r[2], url: r[3] };
    });

  return {
    id: laporan[0],
    idPerjumpaan: laporan[1],
    idKelab: laporan[2],
    tajuk: laporan[3],
    aktiviti: laporan[4],
    namaGuru: laporan[5],
    tarikhHantar: tarikhKeString(laporan[6]),
    pdfUrl: laporan[7],
    gambar: gambar
  };
}

function getSenaraiGuru(token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('GURU');
  var data = sheet.getDataRange().getValues().slice(1);
  return data.map(function(r) {
    return { id: r[0], nama: r[1], jawatan: r[2] };
  });
}

/**
 * Dalaman: padam laporan sesuatu perjumpaan berserta
 * gambar (baris sheet + fail Drive) dan fail PDF.
 * Pulangkan true jika ada laporan dipadam.
 */
function padamLaporanRaw(ss, idPerjumpaan) {
  var sheetL = ss.getSheetByName('LAPORAN_PERJUMPAAN');
  var sheetG = ss.getSheetByName('GAMBAR_LAPORAN');
  var rekodL = sheetL.getDataRange().getValues();

  for (var i = rekodL.length - 1; i >= 1; i--) {
    if (rekodL[i][1] !== idPerjumpaan) continue;
    var idLaporan = rekodL[i][0];
    var pdfUrl = rekodL[i][7] || '';

    // Padam gambar (fail Drive + baris)
    var rekodG = sheetG.getDataRange().getValues();
    for (var g = rekodG.length - 1; g >= 1; g--) {
      if (rekodG[g][1] === idLaporan) {
        try {
          var mG = (rekodG[g][3] || '')
            .match(/[-\w]{25,}/);
          if (mG) DriveApp.getFileById(mG[0])
            .setTrashed(true);
        } catch(eG) {}
        sheetG.deleteRow(g + 1);
      }
    }

    // Padam PDF
    try {
      var mP = pdfUrl.match(/[-\w]{25,}/);
      if (mP) DriveApp.getFileById(mP[0])
        .setTrashed(true);
    } catch(eP) {}

    sheetL.deleteRow(i + 1);
    return true;
  }
  return false;
}

/**
 * ADMIN SAHAJA: Padam laporan perjumpaan
 * (baris sheet + gambar + PDF di Drive).
 */
function padamLaporan(idPerjumpaan, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh memadam.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ada = padamLaporanRaw(ss, idPerjumpaan);
    if (!ada)
      return { berjaya: false,
               mesej: 'Laporan tidak dijumpai.' };
    logAktiviti(sesi.id, 'PADAM_LAPORAN',
      'Perjumpaan:' + idPerjumpaan);
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}
