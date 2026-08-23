// KeahlianBackend.gs
// Fasa 5 — Backend untuk Keahlian.html & Senarai.html
//
// Skema rujukan:
// MURID_MASTER : IC, NAMA, TAHUN, KELAS, KELAS_LABEL,
//                JANTINA, AGAMA, KAUM, STATUS, TARIKH_KEMASKINI
// KEAHLIAN     : IC, ID_KELAB, KATEGORI, JAWATAN,
//                TAHUN_AKADEMIK, STATUS
// KELAB        : ID_KELAB, NAMA_KELAB, KATEGORI, JENIS_KELAB,
//                GURU_PENASIHAT_1, GURU_PENASIHAT_2, STATUS

// ============================================
// BAHAGIAN 1: KEAHLIAN (Keahlian.html)
// ============================================

/**
 * Data penuh satu kelab: info, senarai ahli tahun semasa,
 * dan pilihan jawatan (ikut jenis kelab).
 */
function getDataKeahlianKelab(idKelab, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();

  // Info kelab
  var dataKelab = ss.getSheetByName('KELAB')
    .getDataRange().getValues().slice(1);
  var k = dataKelab.filter(function(r) {
    return r[0] === idKelab;
  })[0];
  if (!k) return null;

  var info = {
    id: k[0], nama: k[1], kategori: k[2],
    jenis: k[3], guru1: k[4], guru2: k[5]
  };

  // Peta murid
  var muridMap = {};
  ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1)
    .forEach(function(r) {
      muridMap[r[0]] = {
        nama: r[1], tahun: r[2],
        kelas: r[4], status: r[8]
      };
    });

  // Ahli tahun akademik semasa (semua tahun murid,
  // TIADA had T4+ — had itu hanya untuk kehadiran)
  var ahli = ss.getSheetByName('KEAHLIAN')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      return r[1] === idKelab &&
             r[4] === tetapan.TAHUN_AKADEMIK &&
             r[5] === 'AKTIF' &&
             muridMap[r[0]] &&
             muridMap[r[0]].status === 'AKTIF';
    }).map(function(r) {
      return {
        ic: r[0],
        nama: muridMap[r[0]].nama,
        tahun: muridMap[r[0]].tahun,
        kelas: muridMap[r[0]].kelas,
        jawatan: r[3]
      };
    }).sort(function(a, b) {
      // Susun ikut kelas dahulu, kemudian nama
      var kA = (a.kelas || '').toString();
      var kB = (b.kelas || '').toString();
      if (kA !== kB) return kA.localeCompare(kB,
        undefined, { numeric: true });
      return a.nama.localeCompare(b.nama);
    });

  // Pilihan jawatan ikut jenis kelab
  // (guna jadual sedia ada dalam PenilaianBackend.gs)
  var jawatanPilihan = getSenaraiJawatanKelab(
    info.jenis || '', token
  ).map(function(j) { return j.nama; });

  return {
    info: info,
    ahli: ahli,
    jawatanPilihan: jawatanPilihan
  };
}

/**
 * Cari murid AKTIF untuk ditambah sebagai ahli.
 * Tidak sertakan murid yang sudah ada keahlian AKTIF
 * dalam KATEGORI yang sama pada tahun semasa.
 */
function cariMuridUntukKeahlian(carian, idKelab, token) {
  if (!semakSesi(token)) return null;
  if (!carian || carian.trim().length < 2) return [];

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();

  var dataKelab = ss.getSheetByName('KELAB')
    .getDataRange().getValues().slice(1);
  var k = dataKelab.filter(function(r) {
    return r[0] === idKelab;
  })[0];
  if (!k) return [];
  var kategori = k[2];
  var setTahunKoku = getTahunKokuSet(kategori);

  // Peta nama kelab (untuk mesej "sudah ahli X")
  var namaKelabMap = {};
  dataKelab.forEach(function(r) {
    namaKelabMap[r[0]] = r[1];
  });

  // IC yang sudah ada keahlian kategori ini tahun ini
  var sudahAda = {};
  ss.getSheetByName('KEAHLIAN')
    .getDataRange().getValues().slice(1)
    .forEach(function(r) {
      if (r[2] === kategori &&
          r[4] === tetapan.TAHUN_AKADEMIK &&
          r[5] === 'AKTIF') {
        sudahAda[r[0]] = namaKelabMap[r[1]] || r[1];
      }
    });

  var q = carian.trim().toLowerCase();
  return ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      if (r[8] !== 'AKTIF') return false;
      // Tapis murid tahun yang tiada koku ini
      if (setTahunKoku !== null &&
          setTahunKoku.indexOf(
            String(Number(r[2]))) === -1) return false;
      var nama = (r[1] || '').toString().toLowerCase();
      var ic = (r[0] || '').toString().toLowerCase();
      var kelas = (r[4] || '').toString().toLowerCase();
      return nama.includes(q) || ic.includes(q) ||
             kelas.includes(q);
    })
    .slice(0, 20)
    .map(function(r) {
      return {
        ic: r[0], nama: r[1], kelas: r[4],
        sudahAhli: sudahAda[r[0]] || null
      };
    });
}

/**
 * Tambah seorang ahli secara manual
 * (cth: murid pindah masuk pertengahan tahun).
 */
function tambahAhliKelab(ic, idKelab, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tetapan = getTetapan();

    var k = ss.getSheetByName('KELAB')
      .getDataRange().getValues().slice(1)
      .filter(function(r) { return r[0] === idKelab; })[0];
    if (!k)
      return { berjaya: false,
               mesej: 'Kelab tidak dijumpai.' };
    var kategori = k[2];

    // Sekat murid tahun yang tiada koku kategori ini
    var setTahunK = getTahunKokuSet(kategori);
    if (setTahunK !== null) {
      var muridRek = ss.getSheetByName('MURID_MASTER')
        .getDataRange().getValues().slice(1)
        .filter(function(r) {
          return samaNilai(r[0], ic);
        })[0];
      if (muridRek && setTahunK.indexOf(
          String(Number(muridRek[2]))) === -1) {
        return { berjaya: false,
          mesej: 'Tiada ' + kategori +
            ' untuk Tahun/Tingkatan ' + muridRek[2] +
            ' di sekolah ini.' };
      }
    }

    var sheetKeahlian = ss.getSheetByName('KEAHLIAN');
    var rekod = sheetKeahlian.getDataRange().getValues();

    // Semak duplicate: kategori sama, tahun sama, AKTIF
    for (var i = 1; i < rekod.length; i++) {
      if (samaNilai(rekod[i][0], ic) &&
          rekod[i][2] === kategori &&
          rekod[i][4] === tetapan.TAHUN_AKADEMIK &&
          rekod[i][5] === 'AKTIF') {
        return {
          berjaya: false,
          mesej: 'Murid sudah ada keahlian ' +
            kategori + ' tahun ini.'
        };
      }
      // Jika rekod sama kelab tapi TIDAK AKTIF →
      // aktifkan semula
      if (samaNilai(rekod[i][0], ic) &&
          rekod[i][1] === idKelab &&
          rekod[i][4] === tetapan.TAHUN_AKADEMIK &&
          rekod[i][5] !== 'AKTIF') {
        sheetKeahlian.getRange(i + 1, 6)
          .setValue('AKTIF');
        logAktiviti(sesi.id, 'AKTIF_SEMULA_AHLI',
          'IC:' + ic + ' Kelab:' + idKelab);
        return { berjaya: true };
      }
    }

    sheetKeahlian.appendRow([
      ic, idKelab, kategori, 'Ahli Biasa',
      tetapan.TAHUN_AKADEMIK, 'AKTIF'
    ]);
    logAktiviti(sesi.id, 'TAMBAH_AHLI',
      'IC:' + ic + ' Kelab:' + idKelab);
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

/**
 * Tukar jawatan ahli dalam sheet KEAHLIAN.
 * NOTA: Markah jawatan PAJSK diset berasingan melalui
 * modul Penilaian (simpanJawatan).
 */
function tukarJawatanAhli(ic, idKelab, jawatan, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tetapan = getTetapan();
    var sheet = ss.getSheetByName('KEAHLIAN');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (samaNilai(rekod[i][0], ic) &&
          rekod[i][1] === idKelab &&
          rekod[i][4] === tetapan.TAHUN_AKADEMIK &&
          rekod[i][5] === 'AKTIF') {
        sheet.getRange(i + 1, 4).setValue(jawatan);
        logAktiviti(sesi.id, 'TUKAR_JAWATAN',
          'IC:' + ic + ' → ' + jawatan);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Keahlian tidak dijumpai.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

/**
 * Buang ahli (set TIDAK AKTIF — tidak delete,
 * supaya rekod kehadiran lama kekal).
 */
function buangAhliKelab(ic, idKelab, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh membuang ahli.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tetapan = getTetapan();
    var sheet = ss.getSheetByName('KEAHLIAN');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (samaNilai(rekod[i][0], ic) &&
          rekod[i][1] === idKelab &&
          rekod[i][4] === tetapan.TAHUN_AKADEMIK &&
          rekod[i][5] === 'AKTIF') {
        sheet.getRange(i + 1, 6)
          .setValue('TIDAK AKTIF');
        logAktiviti(sesi.id, 'BUANG_AHLI',
          'IC:' + ic + ' Kelab:' + idKelab);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Keahlian tidak dijumpai.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

// ============================================
// BAHAGIAN 2: SENARAI (Senarai.html)
// ============================================

/**
 * Senarai kelas unik (murid AKTIF sahaja),
 * disusun ikut tahun kemudian nama kelas.
 */
function getSenaraiKelasAktif(token) {
  if (!semakSesi(token)) return null;
  var cache = cacheDapatkan('KELAS_AKTIF_V1');
  if (cache) return cache;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1);

  var kelasSet = {};
  data.forEach(function(r) {
    if (r[8] === 'AKTIF' && r[4]) {
      kelasSet[r[4]] = parseInt(r[2]) || 0;
    }
  });

  var hasil = Object.keys(kelasSet)
    .sort(function(a, b) {
      if (kelasSet[a] !== kelasSet[b])
        return kelasSet[a] - kelasSet[b];
      return a.localeCompare(b);
    });
  cacheSimpan('KELAS_AKTIF_V1', hasil, 600);
  return hasil;
}

/**
 * Senarai murid satu kelas + keahlian mereka
 * (Unit / Kelab / Sukan / Rumah) tahun semasa.
 */
function getSenaraiIkutKelas(kelasLabel, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();

  var namaKelabMap = {};
  ss.getSheetByName('KELAB')
    .getDataRange().getValues().slice(1)
    .forEach(function(r) {
      namaKelabMap[r[0]] = r[1];
    });

  // Peta IC → keahlian ikut kategori
  var keahlianMap = {};
  ss.getSheetByName('KEAHLIAN')
    .getDataRange().getValues().slice(1)
    .forEach(function(r) {
      if (r[4] !== tetapan.TAHUN_AKADEMIK ||
          r[5] !== 'AKTIF') return;
      if (!keahlianMap[r[0]]) keahlianMap[r[0]] = {};
      var nama = namaKelabMap[r[1]] || r[1];
      if (r[2] === 'Unit Beruniform')
        keahlianMap[r[0]].unit = nama;
      else if (r[2] === 'Kelab & Persatuan')
        keahlianMap[r[0]].kelab = nama;
      else if (r[2] === 'Sukan & Permainan')
        keahlianMap[r[0]].sukan = nama;
      else if (r[2] === 'Rumah Sukan')
        keahlianMap[r[0]].rumah = nama;
    });

  return ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      return r[8] === 'AKTIF' && r[4] === kelasLabel;
    })
    .map(function(r) {
      var k = keahlianMap[r[0]] || {};
      return {
        ic: r[0], nama: r[1],
        jantina: r[5],
        unit: k.unit || '',
        kelab: k.kelab || '',
        sukan: k.sukan || '',
        rumah: k.rumah || ''
      };
    })
    .sort(function(a, b) {
      return a.nama.localeCompare(b.nama);
    });
}


/**
 * ADMIN SAHAJA: Padam rekod keahlian secara KEKAL
 * (deleteRow). Guru biasa hanya boleh nyahaktif.
 */
function padamKeahlianKekal(ic, idKelab, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh memadam.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tetapan = getTetapan();
    var sheet = ss.getSheetByName('KEAHLIAN');
    var rekod = sheet.getDataRange().getValues();

    for (var i = rekod.length - 1; i >= 1; i--) {
      if (samaNilai(rekod[i][0], ic) &&
          rekod[i][1] === idKelab &&
          samaNilai(rekod[i][4], tetapan.TAHUN_AKADEMIK)) {
        sheet.deleteRow(i + 1);
        logAktiviti(sesi.id, 'PADAM_KEAHLIAN',
          'IC:' + ic + ' Kelab:' + idKelab);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Keahlian tidak dijumpai.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}


/**
 * SEMAKAN KEAHLIAN (v3.2)
 * Senarai murid + status keahlian setiap kategori.
 * kelas kosong = semua kelas.
 * Status: 'ada' (+nama kelab), 'tiada', 'tb'
 * (tidak berkenaan ikut tetapan Tahun Ada Koku).
 */
function getSemakanKeahlian(kelas, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin') return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();

  var namaKelab = {};
  ss.getSheetByName('KELAB').getDataRange().getValues()
    .slice(1).forEach(function(r) {
      namaKelab[r[0]] = r[1];
    });

  // ic -> { kategori: nama kelab } (AKTIF, tahun ini)
  var ada = {};
  ss.getSheetByName('KEAHLIAN').getDataRange().getValues()
    .slice(1).forEach(function(r) {
      if (r[5] !== 'AKTIF') return;
      if (!samaNilai(r[4], tetapan.TAHUN_AKADEMIK)) return;
      var ic = String(r[0]);
      if (!ada[ic]) ada[ic] = {};
      ada[ic][r[2]] = { id: r[1],
        nama: namaKelab[r[1]] || '?' };
    });

  var senaraiKat = ['Unit Beruniform',
    'Kelab & Persatuan', 'Sukan & Permainan',
    'Rumah Sukan'];
  var setKat = {};
  senaraiKat.forEach(function(k) {
    setKat[k] = getTahunKokuSet(k);
  });

  return ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      if (r[8] !== 'AKTIF') return false;
      if (kelas && !samaNilai(r[4], kelas)) return false;
      return true;
    })
    .map(function(r) {
      var ic = String(r[0]);
      var kat = {};
      senaraiKat.forEach(function(k) {
        var set = setKat[k];
        if (set !== null && set.indexOf(
            String(Number(r[2]))) === -1) {
          kat[k] = { s: 'tb' };
        } else if (ada[ic] && ada[ic][k]) {
          kat[k] = { s: 'ada',
            nama: ada[ic][k].nama,
            id: ada[ic][k].id };
        } else {
          kat[k] = { s: 'tiada' };
        }
      });
      return { ic: ic, nama: r[1], kelas: r[4],
               tahun: r[2], kat: kat };
    })
    .sort(function(a, b) {
      var ka = String(a.kelas), kb = String(b.kelas);
      if (ka !== kb) return ka < kb ? -1 : 1;
      return String(a.nama) < String(b.nama) ? -1 : 1;
    });
}


/**
 * TUKAR KELAB AHLI (v3.4, admin sahaja)
 * Pindahkan keahlian aktif murid dalam kategori
 * yang sama ke kelab lain. Jawatan direset ke
 * Ahli Biasa.
 */
function tukarKelabAhli(ic, idKelabBaru, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Akses ditolak. Admin sahaja.' };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tetapan = getTetapan();

    var k = ss.getSheetByName('KELAB')
      .getDataRange().getValues().slice(1)
      .filter(function(r) {
        return r[0] === idKelabBaru;
      })[0];
    if (!k)
      return { berjaya: false,
               mesej: 'Kelab tidak dijumpai.' };
    var kategori = k[2];

    var sheet = ss.getSheetByName('KEAHLIAN');
    var rekod = sheet.getDataRange().getValues();
    for (var i = 1; i < rekod.length; i++) {
      if (samaNilai(rekod[i][0], ic) &&
          rekod[i][2] === kategori &&
          samaNilai(rekod[i][4],
            tetapan.TAHUN_AKADEMIK) &&
          rekod[i][5] === 'AKTIF') {
        if (rekod[i][1] === idKelabBaru)
          return { berjaya: false,
            mesej: 'Murid sudah dalam kelab ini.' };
        sheet.getRange(i + 1, 2)
          .setValue(idKelabBaru);
        sheet.getRange(i + 1, 4)
          .setValue('Ahli Biasa');
        logAktiviti(sesi.id, 'TUKAR_KELAB_AHLI',
          'IC:' + ic + ' → ' + idKelabBaru);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
      mesej: 'Tiada keahlian ' + kategori +
        ' aktif untuk murid ini.' };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}
