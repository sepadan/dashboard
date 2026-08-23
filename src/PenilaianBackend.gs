// PenilaianBackend.gs

function simpanKomitmen(ic, idKelab, aspek, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KOMITMEN_DETAIL');
    var tetapan = getTetapan();
    var tahun = tetapan.TAHUN_AKADEMIK;

    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (samaNilai(data[i][0], ic) &&
          data[i][1] === idKelab &&
          samaNilai(data[i][2], tahun)) {
        sheet.deleteRow(i + 1);
      }
    }

    var aspekDipilih = aspek.slice(0, 4);
    aspekDipilih.forEach(function(a) {
      sheet.appendRow([
        ic, idKelab, tahun, a.nama, a.markah
      ]);
    });

    var jumlah = aspekDipilih.reduce(function(sum, a) {
      return sum + a.markah;
    }, 0);

    kemaskiniPenilaianKoku(ic, idKelab, tahun,
      'MARKAH_KOMITMEN', jumlah);

    logAktiviti(sesi.id, 'SIMPAN_KOMITMEN',
      'IC:' + ic + ' Kelab:' + idKelab);
    return { berjaya: true, markah: jumlah };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function simpanKhidmat(ic, idKelab, jenis,
                        markah, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var tetapan = getTetapan();
    var tahun = tetapan.TAHUN_AKADEMIK;
    kemaskiniPenilaianKoku(ic, idKelab, tahun,
      'MARKAH_KHIDMAT', markah);
    logAktiviti(sesi.id, 'SIMPAN_KHIDMAT',
      'IC:' + ic + ' Jenis:' + jenis);
    return { berjaya: true, markah: markah };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function simpanPenglibatan(ic, idKelab, jenis,
                            peringkat, markah, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var tetapan = getTetapan();
    var tahun = tetapan.TAHUN_AKADEMIK;
    kemaskiniPenilaianKoku(ic, idKelab, tahun,
      'MARKAH_PENGLIBATAN', markah);
    logAktiviti(sesi.id, 'SIMPAN_PENGLIBATAN',
      'IC:' + ic + ' Peringkat:' + peringkat);
    return { berjaya: true, markah: markah };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function simpanJawatan(ic, idKelab, jawatan,
                        markah, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tetapan = getTetapan();
    var tahun = tetapan.TAHUN_AKADEMIK;

    var sheetK = ss.getSheetByName('KEAHLIAN');
    var data = sheetK.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (samaNilai(data[i][0], ic) &&
          data[i][1] === idKelab &&
          samaNilai(data[i][4], tahun)) {
        sheetK.getRange(i + 1, 4).setValue(jawatan);
        break;
      }
    }

    kemaskiniPenilaianKoku(ic, idKelab, tahun,
      'MARKAH_JAWATAN', markah);
    logAktiviti(sesi.id, 'SIMPAN_JAWATAN',
      'IC:' + ic + ' Jawatan:' + jawatan);
    return { berjaya: true, markah: markah };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function kemaskiniPenilaianKoku(ic, idKelab,
                                  tahun, lajur, nilai) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PENILAIAN_KOKU');
  var header = sheet.getRange(1, 1, 1,
    sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var indeksLajur = header.indexOf(lajur) + 1;
  if (indeksLajur === 0) return;

  for (var i = 1; i < data.length; i++) {
    if (samaNilai(data[i][0], ic) &&
        data[i][1] === idKelab &&
        samaNilai(data[i][2], tahun)) {
      sheet.getRange(i + 1, indeksLajur).setValue(nilai);
      return;
    }
  }

  var barisKosong = [ic, idKelab, tahun,
    0, 0, 0, 0, 0, 0, 0, 0];
  var indeksData = header.indexOf(lajur);
  barisKosong[indeksData] = nilai;
  sheet.appendRow(barisKosong);
}

function getPenilaianMurid(ic, idKelab, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();
  var tahun = tetapan.TAHUN_AKADEMIK;

  var sheetP = ss.getSheetByName('PENILAIAN_KOKU');
  var dataPenilaian = sheetP.getDataRange()
    .getValues().slice(1).filter(function(r) {
      return samaNilai(r[0], ic) &&
             r[1] === idKelab &&
             samaNilai(r[2], tahun);
    })[0];

  var sheetK = ss.getSheetByName('KOMITMEN_DETAIL');
  var dataKomitmen = sheetK.getDataRange()
    .getValues().slice(1).filter(function(r) {
      return samaNilai(r[0], ic) &&
             r[1] === idKelab &&
             samaNilai(r[2], tahun);
    }).map(function(r) {
      return { nama: r[3], markah: r[4] };
    });

  return {
    jawatan: dataPenilaian ? dataPenilaian[3] : 0,
    penglibatan: dataPenilaian ? dataPenilaian[4] : 0,
    komitmen: dataPenilaian ? dataPenilaian[5] : 0,
    khidmat: dataPenilaian ? dataPenilaian[6] : 0,
    kehadiran: dataPenilaian ? dataPenilaian[7] : 0,
    pencapaian: dataPenilaian ? dataPenilaian[8] : 0,
    aspekKomitmen: dataKomitmen
  };
}

function simpanEkstra(ic, data, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('EKSTRA_KURIKULUM');
    var tetapan = getTetapan();
    var tahun = tetapan.TAHUN_AKADEMIK;

    var rekod = sheet.getDataRange().getValues();
    for (var i = rekod.length - 1; i >= 1; i--) {
      if (samaNilai(rekod[i][0], ic) &&
          samaNilai(rekod[i][1], tahun) &&
          rekod[i][2] === data.jenis) {
        sheet.deleteRow(i + 1);
      }
    }

    sheet.appendRow([
      ic, tahun, data.jenis,
      data.perkara, data.peringkat, data.markah
    ]);

    logAktiviti(sesi.id, 'SIMPAN_EKSTRA',
      'IC:' + ic + ' Jenis:' + data.jenis);
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function getEkstraMurid(ic, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('EKSTRA_KURIKULUM');
  var tetapan = getTetapan();
  var tahun = tetapan.TAHUN_AKADEMIK;

  return sheet.getDataRange().getValues().slice(1)
    .filter(function(r) {
      return samaNilai(r[0], ic) && samaNilai(r[1], tahun);
    }).map(function(r) {
      return {
        jenis: r[2], perkara: r[3],
        peringkat: r[4], markah: r[5]
      };
    });
}

// ============================================
// JADUAL JAWATAN PAJSK (v4.1)
// Ikut Garis Panduan KPM — rendah & menengah.
// ============================================
var JAWATAN_LALAI = [
  { nama: 'Pengerusi / Kapten', markah: 10 },
  { nama: 'Naib Pengerusi / Setiausaha / Bendahari',
    markah: 8 },
  { nama: 'Penolong Setiausaha / AJK', markah: 6 },
  { nama: 'Ahli Aktif', markah: 4 },
  { nama: 'Ahli Berdaftar', markah: 2 }
];

function jadualNGO_() {
  return [
    { nama: 'Pengerusi', markah: 10 },
    { nama: 'Naib Pengerusi', markah: 8 },
    { nama: 'Setiausaha / Bendahari', markah: 7 },
    { nama: 'Naib Setiausaha / Naib Bendahari',
      markah: 6 },
    { nama: 'Ahli Jawatankuasa', markah: 5 },
    { nama: 'Ahli Aktif', markah: 4 },
    { nama: 'Ahli Biasa', markah: 2 }
  ];
}

function jadualSeniBelaDiri_() {
  return [
    { nama: 'Pengerusi / Bengkung Merah / T.P. Hitam',
      markah: 10 },
    { nama: 'Naib Pengerusi / Bengkung Hijau 3 / ' +
      'T.P. Merah 2', markah: 8 },
    { nama: 'SU / Bendahari / Bengkung Hijau 2 / ' +
      'T.P. Merah 1', markah: 7 },
    { nama: 'Pen. SU / Pen. Bendahari / Bengkung ' +
      'Hijau 1 / T.P. Biru 2', markah: 6 },
    { nama: 'AJK / Cula 3 / T.P. Biru 1', markah: 5 },
    { nama: 'Ahli Aktif / Cula 2 / T.P. Hijau',
      markah: 4 },
    { nama: 'Ahli Biasa / T.P. Kuning', markah: 2 }
  ];
}

function jadualRumahSukan_() {
  return [
    { nama: 'Ketua Rumah', markah: 10 },
    { nama: 'Penolong Ketua Rumah', markah: 8 },
    { nama: 'AJK', markah: 6 },
    { nama: 'Ahli Aktif', markah: 4 },
    { nama: 'Ahli Biasa', markah: 2 }
  ];
}

function getJadualJawatanSemua_() {
  var pangkat = function(s) {
    return [
      { nama: 'Sarjan' + s, markah: 10 },
      { nama: 'Koperal' + s, markah: 8 },
      { nama: 'Lans Koperal' + s, markah: 7 },
      { nama: 'Ahli Aktif', markah: 4 },
      { nama: 'Ahli Biasa', markah: 2 }
    ];
  };

  if (getJenisSekolah() === 'menengah') {
    var kadet = function(n) {
      return [
        { nama: n[0], markah: 10 },
        { nama: n[1], markah: 8 },
        { nama: n[2], markah: 7 },
        { nama: n[3], markah: 6 },
        { nama: n[4], markah: 5 },
        { nama: 'Ahli Aktif', markah: 4 },
        { nama: 'Ahli Biasa', markah: 2 }
      ];
    };
    return {
      'KRS': kadet(['Pegawai Waran KRS',
        'Staf Sarjan KRS', 'Sarjan KRS',
        'Koperal KRS', 'Lans Koperal KRS']),
      'PKBM': kadet(['Waran II',
        'Staf Sarjan / Bintara Kanan / Flight Sarjan',
        'Sarjan / Bintara Muda / Sarjan Udara',
        'Koperal / Laskar Kanan / Koperal Udara',
        'Lans Koperal / Laskar Muda']),
      'Kor Kadet Polis': kadet(['Sub Inspektor',
        'Sarjan Mejar', 'Sarjan', 'Koperal',
        'Lans Koperal']),
      'Kadet Bomba': kadet(['Pegawai Kadet',
        'Staf Sarjan', 'Sarjan', 'Koperal',
        'Lans Koperal']),
      'Kadet APM': kadet(['Pegawai Kanan Kadet',
        'Pegawai Waran Kadet', 'Sarjan Kadet',
        'Koperal Kadet', 'Lans Koperal Kadet']),
      'Kadet Koreksional': kadet([
        'Inspektor Kadet', 'Sarjan Mejar', 'Sarjan',
        'Koperal', 'Lans Koperal']),
      'Kadet JPJ': kadet([
        'Kadet Penolong Penguatkuasa',
        'Ketua Pembantu Penguatkuasa Tertinggi',
        'Ketua Pembantu Penguatkuasa',
        'Pembantu Penguatkuasa', 'Lans Koperal']),
      'Pengakap': [
        { nama: 'Ketua Trup', markah: 10 },
        { nama: 'Penolong Ketua Trup', markah: 8 },
        { nama: 'Ketua Patrol', markah: 7 },
        { nama: 'Penolong Ketua Patrol', markah: 6 },
        { nama: 'Quatermaster', markah: 5 },
        { nama: 'Ahli Aktif', markah: 4 },
        { nama: 'Ahli Biasa', markah: 2 }
      ],
      'Pandu Puteri': jadualNGO_(),
      'Puteri Islam': [
        { nama: 'Mega Puteri', markah: 10 },
        { nama: 'Puteri Megasari', markah: 8 },
        { nama: 'Puteri Bistaria', markah: 7 },
        { nama: 'Puteri Kejora', markah: 6 },
        { nama: 'Puteri Saujana / Ketua Pasukan',
          markah: 5 },
        { nama: 'Ahli Aktif / Puteri Mestika',
          markah: 4 },
        { nama: 'Ahli Biasa', markah: 2 }
      ],
      'BSMM': [
        { nama: 'Ketua Seksyen Utama / Pengerusi',
          markah: 10 },
        { nama: 'Pen. Ketua Seksyen / Timb. Pengerusi',
          markah: 8 },
        { nama: 'Ketua Platun', markah: 7 },
        { nama: 'Penolong Ketua Platun', markah: 6 },
        { nama: 'Ahli Jawatankuasa', markah: 5 },
        { nama: 'Ahli Aktif', markah: 4 },
        { nama: 'Ahli Biasa', markah: 2 }
      ],
      'St. John': [
        { nama: 'Sarjan Dewasa / Ketua Kadet',
          markah: 10 },
        { nama: 'Koperal Dewasa / Sarjan Kadet',
          markah: 8 },
        { nama: 'Lans Koperal Dewasa / Koperal Kadet',
          markah: 7 },
        { nama: 'Lans Koperal Kadet', markah: 6 },
        { nama: 'Ahli Jawatankuasa', markah: 5 },
        { nama: 'Ahli Aktif', markah: 4 },
        { nama: 'Ahli Biasa', markah: 2 }
      ],
      'Briged Putera': kadet(['Sarjan Major',
        'Sarjan', 'Koperal', 'Lans Koperal',
        'Ahli Jawatankuasa']),
      'Briged Puteri': jadualNGO_(),
      'Briged Bakti': jadualNGO_(),
      'Joyful Vanguard': jadualNGO_(),
      'RIMAP': jadualNGO_(),
      'Pancaragam': [
        { nama: 'Drum Major', markah: 10 },
        { nama: 'Ketua Seksyen', markah: 8 },
        { nama: 'Penolong Ketua Seksyen', markah: 7 },
        { nama: 'Kuartermaster', markah: 6 },
        { nama: 'Ahli Jawatankuasa', markah: 5 },
        { nama: 'Ahli Aktif', markah: 4 },
        { nama: 'Ahli Biasa', markah: 2 }
      ],
      'Seni Bela Diri': jadualSeniBelaDiri_(),
      'Rumah Sukan': jadualRumahSukan_()
    };
  }

  // SEKOLAH RENDAH
  return {
    'Pengakap': [
      { nama: 'Ketua Pek', markah: 10 },
      { nama: 'Penolong Ketua Pek', markah: 8 },
      { nama: 'Ketua Sekawan', markah: 7 },
      { nama: 'Pen. Ketua Sekawan / Quatermaster',
        markah: 6 },
      { nama: 'Ahli Aktif', markah: 4 },
      { nama: 'Ahli Biasa', markah: 2 }
    ],
    'Pandu Puteri Tunas': jadualNGO_(),
    'Puteri Islam': [
      { nama: 'Mega Puteri', markah: 10 },
      { nama: 'Puteri Megasari', markah: 8 },
      { nama: 'Puteri Bistaria', markah: 7 },
      { nama: 'Puteri Kejora', markah: 6 },
      { nama: 'Puteri Saujana / Ketua Pasukan',
        markah: 5 },
      { nama: 'Ahli Aktif / Puteri Mestika',
        markah: 4 },
      { nama: 'Ahli Biasa', markah: 2 }
    ],
    'TKRS': pangkat(' TKRS'),
    'TUSPA': pangkat(''),
    'BSMM': [
      { nama: 'Ketua Seksyen Utama', markah: 10 },
      { nama: 'Penolong Ketua Seksyen', markah: 8 },
      { nama: 'Ketua Platun', markah: 7 },
      { nama: 'Penolong Ketua Platun', markah: 6 },
      { nama: 'Ahli Jawatankuasa', markah: 5 },
      { nama: 'Ahli Aktif', markah: 4 },
      { nama: 'Ahli Biasa', markah: 2 }
    ],
    'St. John': jadualNGO_(),
    'Briged Putera': [
      { nama: 'Leading Boy 1', markah: 10 },
      { nama: 'Leading Boy 2', markah: 8 },
      { nama: 'Leading Boy 3', markah: 7 },
      { nama: 'Naib Setiausaha / Naib Bendahari',
        markah: 6 },
      { nama: 'Ahli Jawatankuasa', markah: 5 },
      { nama: 'Ahli Aktif', markah: 4 },
      { nama: 'Ahli Biasa', markah: 2 }
    ],
    'Briged Puteri': jadualNGO_(),
    'Briged Bakti': jadualNGO_(),
    'Pancaragam': [
      { nama: 'Pengerusi / Drum Major', markah: 10 },
      { nama: 'Naib Pengerusi / Quatermaster',
        markah: 8 },
      { nama: 'SU / Bendahari / Ketua Seksyen',
        markah: 7 },
      { nama: 'Naib SU / Naib Bendahari', markah: 6 },
      { nama: 'Ahli Jawatankuasa', markah: 5 },
      { nama: 'Ahli Aktif', markah: 4 },
      { nama: 'Ahli Biasa', markah: 2 }
    ],
    'Seni Bela Diri': jadualSeniBelaDiri_(),
    'Rumah Sukan': jadualRumahSukan_()
  };
}

function getSenaraiJawatanKelab(jenisKelab, token) {
  // token null = panggilan dalaman
  if (token !== null && !semakSesi(token)) return null;
  var jadual = getJadualJawatanSemua_();
  // Serasi ke belakang dengan nama jenis lama
  var alias = { 'PBSM': 'BSMM' };
  var kunci = alias[jenisKelab] || jenisKelab;
  return jadual[kunci] || JAWATAN_LALAI;
}

function getSenaraiJenisKoku(token) {
  if (!semakSesi(token)) return null;
  return ['Umum'].concat(
    Object.keys(getJadualJawatanSemua_()));
}

function getMarkahPenglibatan(jenis, peringkat) {
  var jadual = {
    'Penglibatan I': {
      'Antarabangsa': 20, 'Kebangsaan': 17,
      'Negeri': 14, 'Daerah': 11
    },
    'Penglibatan II': {
      'Antarabangsa': 15, 'Kebangsaan': 12,
      'Negeri': 10, 'Daerah': 8
    },
    'Penglibatan III': {
      'Antarabangsa': 10, 'Kebangsaan': 8,
      'Negeri': 6, 'Daerah': 4
    }
  };
  return jadual[jenis] ?
    (jadual[jenis][peringkat] || 0) : 0;
}

function getAhliKelab(idKelab, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetK = ss.getSheetByName('KEAHLIAN');
  var sheetM = ss.getSheetByName('MURID_MASTER');
  var tetapan = getTetapan();

  var muridMap = {};
  sheetM.getDataRange().getValues().slice(1)
    .forEach(function(r) {
      muridMap[r[0]] = {
        nama: r[1], kelas: r[4],
        tahun: parseInt(r[2])
      };
    });

  return sheetK.getDataRange().getValues().slice(1)
    .filter(function(r) {
      return r[1] === idKelab &&
             r[4] === tetapan.TAHUN_AKADEMIK &&
             r[5] === 'AKTIF' &&
             muridMap[r[0]] &&
             muridMap[r[0]].tahun >= 4;
    }).map(function(r) {
      return {
        ic: r[0],
        nama: muridMap[r[0]] ?
          muridMap[r[0]].nama : r[0],
        kelas: muridMap[r[0]] ?
          muridMap[r[0]].kelas : '',
        jawatan: r[3]
      };
    }).sort(function(a, b) {
      return a.nama.localeCompare(b.nama);
    });
}
// ============================================
// PENILAIAN IKUT KELAS (v2.2)
// Senarai keahlian murid (KP/PBB/SP) + jawatan dari
// rekod KEAHLIAN + cadangan penglibatan automatik
// daripada rekod PENCAPAIAN.
// ============================================
function getKeahlianMuridPenilaian(ic, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();
  var tahun = tetapan.TAHUN_AKADEMIK;

  var kelabMap = {};
  ss.getSheetByName('KELAB')
    .getDataRange().getValues().slice(1)
    .forEach(function(r) {
      kelabMap[r[0]] = {
        nama: r[1], kategori: r[2], jenis: r[3]
      };
    });

  // Rekod pencapaian murid tahun ini (untuk cadangan)
  var pencapaian = ss.getSheetByName('PENCAPAIAN')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      return samaNilai(r[1], ic) &&
             samaNilai(r[10], tahun);
    });

  return ss.getSheetByName('KEAHLIAN')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      return samaNilai(r[0], ic) &&
             samaNilai(r[4], tahun) &&
             r[5] === 'AKTIF' &&
             kelabMap[r[1]] &&
             kelabMap[r[1]].kategori !== 'Rumah Sukan';
    })
    .map(function(r) {
      var info = kelabMap[r[1]];

      // Cadangan penglibatan = markah tertinggi dari
      // pencapaian murid untuk kelab ini
      var cadangan = null;
      pencapaian.filter(function(p) {
        return p[9] === r[1] || !p[9];
      }).forEach(function(p) {
        var m = getMarkahPenglibatan(p[6], p[4]);
        if (m > 0 && (!cadangan || m > cadangan.markah)) {
          cadangan = {
            jenis: p[6], peringkat: p[4], markah: m
          };
        }
      });

      return {
        idKelab: r[1],
        namaKelab: info.nama,
        kategori: info.kategori,
        jenis: info.jenis || '',
        jawatan: r[3],
        cadanganPenglibatan: cadangan
      };
    });
}
