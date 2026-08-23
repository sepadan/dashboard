// PAJSKBackend.gs

var JADUAL_TUKAR = {
  0:0,1:0.91,2:1.82,3:2.73,4:3.64,5:4.55,
  6:5.45,7:6.36,8:7.27,9:8.18,10:9.09,
  11:10,12:10.91,13:11.82,14:12.73,15:13.64,
  16:14.55,17:15.45,18:16.36,19:17.27,20:18.18,
  21:19.09,22:20,23:20.91,24:21.82,25:22.73,
  26:23.64,27:24.55,28:25.45,29:26.36,30:27.27,
  31:28.18,32:29.09,33:30,34:30.91,35:31.82,
  36:32.73,37:33.64,38:34.55,39:35.45,40:36.36,
  41:37.27,42:38.18,43:39.09,44:40,45:40.91,
  46:41.82,47:42.73,48:43.64,49:44.55,50:45.45,
  51:46.36,52:47.27,53:48.18,54:49.09,55:50,
  56:50.91,57:51.82,58:52.73,59:53.64,60:54.55,
  61:55.45,62:56.36,63:57.27,64:58.18,65:59.09,
  66:60,67:60.91,68:61.82,69:62.73,70:63.64,
  71:64.55,72:65.45,73:66.36,74:67.27,75:68.18,
  76:69.09,77:70,78:70.91,79:71.82,80:72.73,
  81:73.64,82:74.55,83:75.45,84:76.36,85:77.27,
  86:78.18,87:79.09,88:80,89:80.91,90:81.82,
  91:82.73,92:83.64,93:84.55,94:85.45,95:86.36,
  96:87.27,97:88.18,98:89.09,99:90,100:90.91,
  101:91.82,102:92.73,103:93.64,104:94.55,
  105:95.45,106:96.36,107:97.27,108:98.18,
  109:99.09,110:100
};

function kiraPAJSK(ic, tahun, token) {
  if (!semakSesi(token)) return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetKeahlian = ss.getSheetByName('KEAHLIAN');
  var sheetPenilaian = ss.getSheetByName('PENILAIAN_KOKU');
  var sheetEkstra = ss.getSheetByName('EKSTRA_KURIKULUM');

  var kategoriMap = {
    'Kelab & Persatuan': 'KP',
    'Unit Beruniform': 'PBB',
    'Sukan & Permainan': 'SP'
  };

  var keputusan = {
    KP: null, PBB: null, SP: null,
    ekstra: 0, gpa: 0, cgpa: 0,
    markah10: 0, gred: 'TL',
    duaTertinggi: []
  };

  var keahlian = sheetKeahlian.getDataRange()
    .getValues().slice(1).filter(function(r) {
      return samaNilai(r[0], ic) &&
             samaNilai(r[4], tahun) &&
             r[5] === 'AKTIF';
    });

  keahlian.forEach(function(k) {
    var kategori = k[2];
    var idKelab = k[1];
    var kod = kategoriMap[kategori];
    if (!kod) return;

    var penilaian = sheetPenilaian.getDataRange()
      .getValues().slice(1).filter(function(r) {
        return samaNilai(r[0], ic) &&
               r[1] === idKelab &&
               samaNilai(r[2], tahun);
      })[0];

    var statKH = getStatKehadiranRaw(ic, idKelab);
    var markahPencapaian =
      getMarkahPencapaian(ic, idKelab, tahun);

    var markahJawatan = penilaian ? penilaian[3] : 0;
    var markahPenglibatan = penilaian ? penilaian[4] : 0;
    var markahKomitmen = penilaian ? penilaian[5] : 0;
    var markahKhidmat = penilaian ? penilaian[6] : 0;
    var markahKehadiran = statKH.markahKehadiran || 0;

    var jumlah110 = markahJawatan + markahPenglibatan +
      markahKomitmen + markahKhidmat +
      markahKehadiran + markahPencapaian;

    var jumlah110Bulatkan = Math.min(
      Math.round(jumlah110), 110
    );
    var jumlah100 = JADUAL_TUKAR[jumlah110Bulatkan] || 0;

    keputusan[kod] = {
      idKelab: idKelab,
      jawatan: markahJawatan,
      penglibatan: markahPenglibatan,
      komitmen: markahKomitmen,
      khidmat: markahKhidmat,
      kehadiran: markahKehadiran,
      pencapaian: markahPencapaian,
      jumlah110: jumlah110Bulatkan,
      jumlah100: jumlah100
    };
  });

  var ekstra = sheetEkstra.getDataRange()
    .getValues().slice(1).filter(function(r) {
      return samaNilai(r[0], ic) && samaNilai(r[1], tahun);
    });

  var markahEkstra = 0;
  if (ekstra.length > 0) {
    var markahList = ekstra.map(function(r) {
      return r[5];
    });
    markahEkstra = Math.min(
      Math.max.apply(null, markahList), 10
    );
  }
  keputusan.ekstra = markahEkstra;

  var markahKategori = [
    keputusan.KP ? keputusan.KP.jumlah100 : 0,
    keputusan.PBB ? keputusan.PBB.jumlah100 : 0,
    keputusan.SP ? keputusan.SP.jumlah100 : 0
  ].sort(function(a, b) { return b - a; });

  var duaTertinggi = markahKategori.slice(0, 2);
  var jumlahDua = duaTertinggi.reduce(function(s, m) {
    return s + m;
  }, 0);
  var purata = duaTertinggi.length > 0 ?
    jumlahDua / 2 : 0;

  var gpa = Math.round(
    (purata + markahEkstra) * 100) / 100;
  var cgpa = kiraCGPA(ic, tahun, gpa);
  var markah10 = Math.round(cgpa * 10) / 100;
  // TL jika murid tiada langsung aktiviti kokurikulum
  var gred = (!keputusan.KP && !keputusan.PBB &&
              !keputusan.SP) ?
    'TL' : tentukanGred(gpa);

  keputusan.gpa = gpa;
  keputusan.cgpa = cgpa;
  keputusan.markah10 = markah10;
  keputusan.gred = gred;
  keputusan.duaTertinggi = duaTertinggi;

  simpanPAJSKSummary(ic, tahun, keputusan);
  return keputusan;
}

function kiraCGPA(ic, tahunSemasa, gpaSemasa) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PAJSK_SUMMARY');
  var data = sheet.getDataRange().getValues().slice(1);
  var tahunInt = parseInt(tahunSemasa);

  // SEKOLAH MENENGAH: kumulatif berperingkat
  // CGPA = (CGPA tahun lepas + GPA semasa) / 2
  // (rujuk Jadual 21 Garis Panduan PAJSK SM)
  if (getJenisSekolah() === 'menengah') {
    var lepas = data.filter(function(r) {
      return samaNilai(r[0], ic) &&
             r[1].toString() ===
               (tahunInt - 1).toString();
    })[0];
    if (lepas && lepas[7]) {
      return Math.round(((Number(lepas[7]) +
        gpaSemasa) / 2) * 100) / 100;
    }
    return Math.round(gpaSemasa * 100) / 100;
  }

  // SEKOLAH RENDAH: purata T4-T6
  var jumlahGPA = gpaSemasa;
  var bilTahun = 1;

  // Semak maksimum 2 tahun akademik sebelum
  // (untuk kumulatif T4 → T5 → T6)
  for (var i = 1; i <= 2; i++) {
    var tahunLepas = (tahunInt - i).toString();
    var rekod = data.filter(function(r) {
      return samaNilai(r[0], ic) &&
             r[1].toString() === tahunLepas;
    })[0];
    if (rekod && rekod[6]) {
      jumlahGPA += Number(rekod[6]);
      bilTahun++;
    }
  }

  return Math.round((jumlahGPA / bilTahun) * 100) / 100;
}

function simpanPAJSKSummary(ic, tahun, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PAJSK_SUMMARY');
  var rekod = sheet.getDataRange().getValues();

  var baris = [
    ic, tahun,
    data.KP ? data.KP.jumlah100 : 0,
    data.PBB ? data.PBB.jumlah100 : 0,
    data.SP ? data.SP.jumlah100 : 0,
    data.ekstra, data.gpa,
    data.cgpa, data.markah10, data.gred
  ];

  for (var i = 1; i < rekod.length; i++) {
    if (samaNilai(rekod[i][0], ic) && samaNilai(rekod[i][1], tahun)) {
      sheet.getRange(i + 1, 1, 1, baris.length)
           .setValues([baris]);
      return;
    }
  }
  sheet.appendRow(baris);
}

function getSenaraiPAJSK(filter, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();
  var tahun = filter.tahun || tetapan.TAHUN_AKADEMIK;

  var sheetS = ss.getSheetByName('PAJSK_SUMMARY');
  var sheetM = ss.getSheetByName('MURID_MASTER');

  var muridMap = {};
  sheetM.getDataRange().getValues().slice(1)
    .forEach(function(r) {
      muridMap[r[0]] = {
        nama: r[1], kelas: r[4],
        tahunMurid: r[2]
      };
    });

  return sheetS.getDataRange().getValues().slice(1)
    .filter(function(r) {
      if (r[1] !== tahun) return false;
      var murid = muridMap[r[0]];
      if (!murid) return false;
      if (filter.kelas && murid.kelas !== filter.kelas)
        return false;
      if (filter.tahunMurid &&
          murid.tahunMurid !== filter.tahunMurid)
        return false;
      return true;
    }).map(function(r) {
      return {
        ic: r[0], tahun: r[1],
        nama: muridMap[r[0]] ?
          muridMap[r[0]].nama : r[0],
        kelas: muridMap[r[0]] ?
          muridMap[r[0]].kelas : '',
        markahKP: r[2], markahPBB: r[3],
        markahSP: r[4], ekstra: r[5],
        gpa: r[6], cgpa: r[7],
        markah10: r[8], gred: r[9]
      };
    }).sort(function(a, b) {
      return b.cgpa - a.cgpa;
    });
}

// Gred ikut Jadual 20, Garis Panduan PAJSK KPM:
// A 80-100 | B 60-79.9 | C 40-59.9 | D 20-39.9 | E 0-19.9
// TL (Tidak Laksana) ditentukan berasingan dalam kiraPAJSK
// — hanya untuk murid tanpa sebarang aktiviti.
function tentukanGred(gpa) {
  if (gpa >= 80) return 'A';
  if (gpa >= 60) return 'B';
  if (gpa >= 40) return 'C';
  if (gpa >= 20) return 'D';
  return 'E';
}

function getPeneranganGred(gred) {
  var penerangan = {
    'A': 'Cemerlang — Syabas! Anda seorang yang ' +
         'sangat aktif, komited dan menunjukkan ' +
         'potensi diri yang tinggi dalam aktiviti ' +
         'yang disertai.',
    'B': 'Kepujian — Tahniah! Anda merupakan ' +
         'seorang yang aktif dan komited dalam ' +
         'aktiviti yang disertai.',
    'C': 'Baik — Penglibatan anda memuaskan. ' +
         'Anda perlu lebih berusaha untuk ' +
         'meningkatkan prestasi.',
    'D': 'Kurang Memuaskan — Penglibatan anda ' +
         'kurang. Tingkatkan usaha dalam aktiviti ' +
         'yang disertai.',
    'E': 'Tidak Memuaskan — Penglibatan dan ' +
         'pencapaian anda perlu dipertingkatkan.',
    'TL': 'Tidak Laksana — Murid tidak ' +
          'melaksanakan aktiviti kokurikulum.'
  };
  return penerangan[gred] || '';
}
// ============================================
// ANGGARAN PAJSK (v2.6) — untuk halaman
// Penilaian Koku yang digabung.
// Prinsip: kira berdasarkan DATA SEDIA ADA sahaja.
//   Kehadiran  : auto dari rekod
//   Pencapaian : auto dari rekod
//   Jawatan    : tersimpan; jika tiada, anggar dari
//                jawatan keahlian (bertanda 'anggaran')
//   Penglibatan: tersimpan; jika tiada, anggar dari
//                pencapaian (bertanda 'anggaran')
//   Komitmen & Khidmat: tersimpan sahaja; jika tiada = 0
// ============================================

function kiraAnggaranBatch(senaraiIC) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tetapan = getTetapan();
  var tahun = tetapan.TAHUN_AKADEMIK;

  // ---- Baca semua sheet SEKALI sahaja ----
  var dataMurid = ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1);
  var dataKelab = ss.getSheetByName('KELAB')
    .getDataRange().getValues().slice(1);
  var dataKeahlian = ss.getSheetByName('KEAHLIAN')
    .getDataRange().getValues().slice(1);
  var dataPerjumpaan = ss.getSheetByName('PERJUMPAAN')
    .getDataRange().getValues().slice(1);
  var dataKehadiran = ss.getSheetByName('KEHADIRAN')
    .getDataRange().getValues().slice(1);
  var dataPencapaian = ss.getSheetByName('PENCAPAIAN')
    .getDataRange().getValues().slice(1);
  var dataPenilaian = ss.getSheetByName('PENILAIAN_KOKU')
    .getDataRange().getValues().slice(1);
  var dataEkstra = ss.getSheetByName('EKSTRA_KURIKULUM')
    .getDataRange().getValues().slice(1);

  var kelabMap = {};
  dataKelab.forEach(function(r) {
    kelabMap[r[0]] = {
      nama: r[1], kategori: r[2], jenis: r[3]
    };
  });

  var muridMap = {};
  dataMurid.forEach(function(r) {
    muridMap[String(r[0]).trim()] = {
      ic: r[0], nama: r[1],
      tahun: parseInt(r[2]) || 0,
      kelas: r[4], status: r[8]
    };
  });

  // Bil perjumpaan setiap kelab + peta perjumpaan→kelab
  var bilPerjumpaanKelab = {};
  var kelabPerjumpaan = {};
  dataPerjumpaan.forEach(function(r) {
    if (!r[0]) return;
    kelabPerjumpaan[r[0]] = r[1];
    bilPerjumpaanKelab[r[1]] =
      (bilPerjumpaanKelab[r[1]] || 0) + 1;
  });

  // Kehadiran hadir per (ic|kelab)
  var hadirMap = {};
  dataKehadiran.forEach(function(r) {
    if (r[2] !== 'Hadir') return;
    var kelab = kelabPerjumpaan[r[0]];
    if (!kelab) return;
    var kunci = String(r[1]).trim() + '|' + kelab;
    hadirMap[kunci] = (hadirMap[kunci] || 0) + 1;
  });

  var kategoriKod = {
    'Kelab & Persatuan': 'KP',
    'Unit Beruniform': 'PBB',
    'Sukan & Permainan': 'SP'
  };

  var markahPencapaianJadual = {
    'Antarabangsa': { 'Johan': 20, 'Naib Johan': 19,
      'Ketiga': 18, 'Keempat': 17, 'Kelima': 16 },
    'Kebangsaan': { 'Johan': 17, 'Naib Johan': 16,
      'Ketiga': 15, 'Keempat': 14, 'Kelima': 13 },
    'Negeri': { 'Johan': 14, 'Naib Johan': 13,
      'Ketiga': 12, 'Keempat': 11, 'Kelima': 10 },
    'Daerah': { 'Johan': 11, 'Naib Johan': 10,
      'Ketiga': 9, 'Keempat': 8, 'Kelima': 7 },
    'Sekolah': { 'Johan': 8, 'Naib Johan': 7,
      'Ketiga': 6, 'Keempat': 5, 'Kelima': 4 }
  };

  return senaraiIC.map(function(icAsal) {
    var ic = String(icAsal).trim();
    var murid = muridMap[ic];
    if (!murid) return null;

    var rumahSukan = '';
    var keahlianMurid = dataKeahlian.filter(function(r) {
      return samaNilai(r[0], ic) &&
             samaNilai(r[4], tahun) &&
             r[5] === 'AKTIF' && kelabMap[r[1]];
    });

    var pencapaianMurid = dataPencapaian
      .filter(function(r) {
        return samaNilai(r[1], ic) &&
               samaNilai(r[10], tahun);
      });

    var kekurangan = [];
    var kelabList = [];

    keahlianMurid.forEach(function(k) {
      var info = kelabMap[k[1]];
      if (info.kategori === 'Rumah Sukan') {
        rumahSukan = info.nama;
        return;
      }

      // --- Kehadiran (auto) ---
      var jumlahP = bilPerjumpaanKelab[k[1]] || 0;
      var hadir = hadirMap[ic + '|' + k[1]] || 0;
      var hadirCap = Math.min(hadir, 12);
      var mKehadiran = hadirCap >= 12 ? 40 :
        Math.round(hadirCap * 3.33 * 100) / 100;

      // --- Pencapaian (auto, kelab ini / tanpa kelab) ---
      var pencKelab = pencapaianMurid.filter(function(p) {
        return p[9] === k[1] || !p[9];
      });
      var mPencapaian = 0;
      var cadanganPeng = null;
      pencKelab.forEach(function(p) {
        var jp = markahPencapaianJadual[p[4]];
        var m = jp ? (jp[p[5]] || 0) : 0;
        if (m > mPencapaian) mPencapaian = m;
        var mP = getMarkahPenglibatan(p[6], p[4]);
        if (mP > 0 && (!cadanganPeng ||
            mP > cadanganPeng.markah)) {
          cadanganPeng = {
            jenis: p[6], peringkat: p[4], markah: mP
          };
        }
      });

      // --- Penilaian tersimpan ---
      var pen = dataPenilaian.filter(function(r) {
        return samaNilai(r[0], ic) && r[1] === k[1] &&
               samaNilai(r[2], tahun);
      })[0];

      var mJawatan = pen ? Number(pen[3]) || 0 : 0;
      var sJawatan = mJawatan > 0 ? 'tersimpan' : 'tiada';
      if (mJawatan === 0 && k[3]) {
        var jadualJ = getSenaraiJawatanKelab(
          info.jenis || '', null) || [];
        for (var j = 0; j < jadualJ.length; j++) {
          if (jadualJ[j].nama === k[3]) {
            mJawatan = jadualJ[j].markah;
            sJawatan = 'anggaran';
            break;
          }
        }
      }

      var mPenglibatan = pen ? Number(pen[4]) || 0 : 0;
      var sPenglibatan = mPenglibatan > 0 ?
        'tersimpan' : 'tiada';
      if (mPenglibatan === 0 && cadanganPeng) {
        mPenglibatan = cadanganPeng.markah;
        sPenglibatan = 'anggaran';
      }

      var mKomitmen = pen ? Number(pen[5]) || 0 : 0;
      var mKhidmat = pen ? Number(pen[6]) || 0 : 0;
      if (mKomitmen === 0)
        kekurangan.push('Komitmen: ' + info.nama);
      if (mKhidmat === 0)
        kekurangan.push('Khidmat: ' + info.nama);

      var jumlah110 = Math.min(Math.round(
        mJawatan + mPenglibatan + mKomitmen +
        mKhidmat + mKehadiran + mPencapaian), 110);
      var jumlah100 = JADUAL_TUKAR[jumlah110] || 0;

      kelabList.push({
        idKelab: k[1],
        nama: info.nama,
        kategori: info.kategori,
        kod: kategoriKod[info.kategori] || '',
        jawatanKeahlian: k[3],
        jumlahPerjumpaan: jumlahP,
        hadir: hadir,
        kehadiran: mKehadiran,
        pencapaian: mPencapaian,
        senaraiPencapaian: pencKelab.map(function(p) {
          return {
            nama: p[2], peringkat: p[4], tempat: p[5]
          };
        }),
        jawatan: mJawatan,
        sumberJawatan: sJawatan,
        penglibatan: mPenglibatan,
        sumberPenglibatan: sPenglibatan,
        komitmen: mKomitmen,
        khidmat: mKhidmat,
        jumlah110: jumlah110,
        jumlah100: jumlah100
      });
    });

    // --- Ekstra kurikulum ---
    var ekstraMurid = dataEkstra.filter(function(r) {
      return samaNilai(r[0], ic) &&
             samaNilai(r[1], tahun);
    });
    var mEkstra = 0;
    ekstraMurid.forEach(function(r) {
      var v = Number(r[5]) || 0;
      if (v > mEkstra) mEkstra = v;
    });
    mEkstra = Math.min(mEkstra, 10);

    // --- GPA anggaran: 2 kategori tertinggi ---
    var ikutKod = {};
    kelabList.forEach(function(kl) {
      if (!kl.kod) return;
      if (!ikutKod[kl.kod] ||
          kl.jumlah100 > ikutKod[kl.kod]) {
        ikutKod[kl.kod] = kl.jumlah100;
      }
    });
    var markahKategori = ['KP', 'PBB', 'SP']
      .map(function(kod) { return ikutKod[kod] || 0; })
      .sort(function(a, b) { return b - a; });
    var gpa = Math.round(((markahKategori[0] +
      markahKategori[1]) / 2 + mEkstra) * 100) / 100;
    var gred = kelabList.length === 0 ?
      'TL' : tentukanGred(gpa);

    // ---- Analisis jurang ke gred A (GPA >= 80) ----
    var MAKS = { jawatan: 10, penglibatan: 20,
      komitmen: 10, khidmat: 10, kehadiran: 40,
      pencapaian: 20 };
    var LABEL = { jawatan: 'Jawatan',
      penglibatan: 'Penglibatan', komitmen: 'Komitmen',
      khidmat: 'Khidmat', kehadiran: 'Kehadiran',
      pencapaian: 'Pencapaian' };

    // 2 kelab teratas sahaja yang dikira dalam GPA
    var kelabTeratas = {};
    kelabList.forEach(function(kl) {
      if (!kl.kod) return;
      if (!kelabTeratas[kl.kod] ||
          kl.jumlah100 > kelabTeratas[kl.kod].jumlah100) {
        kelabTeratas[kl.kod] = kl;
      }
    });
    var top2 = Object.keys(kelabTeratas)
      .map(function(k) { return kelabTeratas[k]; })
      .sort(function(a, b) {
        return b.jumlah100 - a.jumlah100;
      }).slice(0, 2);

    var peluang = [];
    top2.forEach(function(kl) {
      Object.keys(MAKS).forEach(function(e) {
        var baki = MAKS[e] - (kl[e] || 0);
        if (baki > 0.01) {
          peluang.push({
            label: LABEL[e] + ' — ' + kl.nama,
            tambah: Math.round(baki * 100) / 100
          });
        }
      });
    });
    if (mEkstra < 10) {
      peluang.push({
        label: 'Ekstra Kurikulum',
        tambah: 10 - mEkstra
      });
    }
    peluang.sort(function(a, b) {
      return b.tambah - a.tambah;
    });

    // GPA maksimum jika semua peluang dipenuhi
    var jumlahPenuh = top2.map(function(kl) {
      return JADUAL_TUKAR[110] || 100;
    });
    while (jumlahPenuh.length < 2) jumlahPenuh.push(0);
    var gpaMaks = top2.length === 0 ? 0 :
      Math.round(((jumlahPenuh[0] + jumlahPenuh[1]) / 2 +
        10) * 100) / 100;

    var perluUntukA = Math.max(0,
      Math.round((80 - gpa) * 100) / 100);

    var jenisSek = getJenisSekolah();
    var layakTaksir = jenisSek === 'menengah' ?
      (murid.tahun >= 1 && murid.tahun <= 5) :
      (murid.tahun >= 4);

    return {
      ic: murid.ic,
      nama: murid.nama,
      kelas: murid.kelas,
      tahunMurid: murid.tahun,
      jenisSekolah: jenisSek,
      layakTaksir: layakTaksir,
      rumahSukan: rumahSukan,
      tahunAkademik: tahun,
      kelab: kelabList,
      kategori: {
        KP: ikutKod.KP || null,
        PBB: ikutKod.PBB || null,
        SP: ikutKod.SP || null
      },
      ekstra: mEkstra,
      gpa: gpa,
      gred: gred,
      kekurangan: kekurangan,
      perluUntukA: perluUntukA,
      gpaMaks: gpaMaks,
      peluang: peluang.slice(0, 8)
    };
  });
}

function getAnggaranMurid(ic, token) {
  if (!semakSesi(token)) return null;
  var hasil = kiraAnggaranBatch([ic]);
  return hasil[0] || null;
}

function getAnggaranKelas(kelas, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var senaraiIC = ss.getSheetByName('MURID_MASTER')
    .getDataRange().getValues().slice(1)
    .filter(function(r) {
      return r[8] === 'AKTIF' && r[4] === kelas;
    })
    .map(function(r) { return String(r[0]).trim(); });

  return kiraAnggaranBatch(senaraiIC)
    .filter(function(a) { return a; })
    .sort(function(a, b) {
      return a.nama.localeCompare(b.nama);
    });
}


/**
 * Simpan ANGGARAN semasa ke rekod PAJSK_SUMMARY
 * (untuk CGPA kumulatif T4-T6). Menggantikan aliran
 * borang penilaian manual yang telah dibuang.
 */
function simpanAnggaranKeRekod(ic, token) {
  var sesi = semakSesi(token);
  if (!sesi)
    return { berjaya: false, mesej: 'Sesi tamat.' };

  try {
    var a = kiraAnggaranBatch([ic])[0];
    if (!a)
      return { berjaya: false,
               mesej: 'Murid tidak dijumpai.' };
    if (!a.layakTaksir)
      return { berjaya: false,
               mesej: 'PAJSK untuk Tahun 4-6 sahaja.' };

    var cgpa = kiraCGPA(String(a.ic),
      a.tahunAkademik, a.gpa);
    var markah10 = Math.round(cgpa * 10) / 100;

    simpanPAJSKSummary(String(a.ic), a.tahunAkademik, {
      KP: a.kategori.KP !== null ?
        { jumlah100: a.kategori.KP } : null,
      PBB: a.kategori.PBB !== null ?
        { jumlah100: a.kategori.PBB } : null,
      SP: a.kategori.SP !== null ?
        { jumlah100: a.kategori.SP } : null,
      ekstra: a.ekstra,
      gpa: a.gpa,
      cgpa: cgpa,
      markah10: markah10,
      gred: a.gred
    });

    logAktiviti(sesi.id, 'SIMPAN_PAJSK',
      'IC:' + ic + ' GPA:' + a.gpa);
    return {
      berjaya: true, gpa: a.gpa, cgpa: cgpa,
      markah10: markah10, gred: a.gred
    };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}
