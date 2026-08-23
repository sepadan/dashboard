// Code.gs

function doGet(e) {
  const tetapan = getTetapan();

  // Belum setup
  if (!tetapan || !tetapan.NAMA_SEKOLAH) {
    var tmplSetup = HtmlService
      .createTemplateFromFile('Setup');
    tmplSetup.url = ScriptApp.getService().getUrl();
    return tmplSetup
      .evaluate()
      .setTitle('Setup AKSI — Aplikasi Kokurikulum Sekolah Integrasi')
      .addMetaTag('viewport',
        'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );
  }

  const token = e && e.parameter ? 
    e.parameter.token : null;
  const halaman = e && e.parameter ? 
    e.parameter.page : null;

  const sesi = token ? semakSesi(token) : null;

  const halamanBerlindung = [
    'Dashboard', 'Admin', 'Keahlian',
    'Kehadiran', 'Laporan', 'Pencapaian',
    'Penilaian', 'Senarai'
  ];

  if (halaman && halamanBerlindung.includes(halaman)) {
    if (!sesi) {
      var tmplLogin1 = HtmlService
        .createTemplateFromFile('Login');
      tmplLogin1.url = ScriptApp.getService().getUrl();
      return tmplLogin1.evaluate()
        .setTitle('Log Masuk — ' + tetapan.NAMA_SEKOLAH)
        .addMetaTag('viewport',
        'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(
          HtmlService.XFrameOptionsMode.ALLOWALL
        );
    }

    if (halaman === 'Admin' && sesi.peranan !== 'admin') {
      return buatHalamanRalat('Akses ditolak.');
    }

    const tmpl = HtmlService
      .createTemplateFromFile(halaman);
    tmpl.token = token;
    tmpl.peranan = sesi.peranan;
    tmpl.namaSekolah = tetapan.NAMA_SEKOLAH;
    tmpl.tahunAkademik = tetapan.TAHUN_AKADEMIK;

    return tmpl.evaluate()
      .setTitle(getNamaHalaman(halaman) +
        ' — ' + tetapan.NAMA_SEKOLAH)
      .addMetaTag('viewport',
        'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );
  }

  if (sesi) {
    const tmpl = HtmlService
      .createTemplateFromFile('Dashboard');
    tmpl.token = token;
    tmpl.peranan = sesi.peranan;
    tmpl.namaSekolah = tetapan.NAMA_SEKOLAH;
    tmpl.tahunAkademik = tetapan.TAHUN_AKADEMIK;

    return tmpl.evaluate()
      .setTitle('Dashboard — ' + tetapan.NAMA_SEKOLAH)
      .addMetaTag('viewport',
        'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );
  }

  var tmplLogin2 = HtmlService
    .createTemplateFromFile('Login');
  tmplLogin2.url = ScriptApp.getService().getUrl();
  return tmplLogin2.evaluate()
    .setTitle('Log Masuk — ' + tetapan.NAMA_SEKOLAH)
    .addMetaTag('viewport',
        'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}

function getNamaHalaman(halaman) {
  const nama = {
    'Dashboard': 'Dashboard',
    'Admin': 'Tetapan & Upload',
    'Keahlian': 'Keahlian',
    'Kehadiran': 'Kehadiran',
    'Laporan': 'Laporan Perjumpaan',
    'Pencapaian': 'Pencapaian',
    'Penilaian': 'Penilaian Koku',
    'Senarai': 'Muat Turun'
  };
  return nama[halaman] || halaman;
}

function buatHalamanRalat(mesej) {
  const url = ScriptApp.getService().getUrl();
  const html =
    '<!DOCTYPE html><html><head>' +
    '<base target="_top">' +
    '<style>body{font-family:sans-serif;display:flex;' +
    'align-items:center;justify-content:center;' +
    'min-height:100vh;margin:0;background:#f0f4f8;}' +
    '.box{background:white;padding:40px;' +
    'border-radius:12px;text-align:center;}' +
    'h2{color:#c62828;}a{color:#1a73e8;}</style>' +
    '</head><body><div class="box">' +
    '<h2>⚠️ Ralat</h2><p>' + mesej + '</p>' +
    '<a href="' + url + '">Kembali ke Login</a>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .addMetaTag('viewport',
        'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}

function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename).getContent();
}

function getTetapan() {
  // Cache 5 minit — tetapan dibaca pada hampir setiap
  // panggilan, jadi ini penjimatan masa yang besar
  try {
    var cache = CacheService.getScriptCache();
    var simpanan = cache.get('TETAPAN_V1');
    if (simpanan) return JSON.parse(simpanan);
  } catch(eC) {}

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('TETAPAN');
    if (!sheet) return null;
    const data = sheet.getDataRange().getValues();
    const tetapan = {};
    data.forEach(function(row) {
      if (row[0]) tetapan[row[0]] = row[1];
    });
    try {
      CacheService.getScriptCache().put('TETAPAN_V1',
        JSON.stringify(tetapan), 300);
    } catch(eC2) {}
    return tetapan;
  } catch(e) {
    return null;
  }
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function getStatistikDashboard(token) {
  if (!semakSesi(token)) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetKelab = ss.getSheetByName('KELAB');
  const dataKelab = sheetKelab.getDataRange().getValues();
  const kelabAktif = dataKelab.slice(1)
    .filter(function(r) { return r[6] === 'AKTIF'; }).length;

  const sheetMurid = ss.getSheetByName('MURID_MASTER');
  const dataMurid = sheetMurid.getDataRange().getValues();
  const muridAktif = dataMurid.slice(1)
    .filter(function(r) { return r[8] === 'AKTIF'; }).length;

  const sheetP = ss.getSheetByName('PERJUMPAAN');
  const dataP = sheetP.getDataRange().getValues();
  const bulanIni = new Date().getMonth();
  const tahunIni = new Date().getFullYear();
  const perjumpaanBulanIni = dataP.slice(1)
    .filter(function(r) {
      if (!r[2]) return false;
      const t = new Date(r[2]);
      return t.getMonth() === bulanIni &&
             t.getFullYear() === tahunIni;
    }).length;

  const sheetL = ss.getSheetByName('LAPORAN_PERJUMPAAN');
  const idLaporanAda = sheetL.getDataRange().getValues()
    .slice(1).map(function(r) { return r[1]; });
  const laporanBelumIsi = dataP.slice(1)
    .filter(function(r) {
      return r[0] && !idLaporanAda.includes(r[0]);
    }).length;

  return {
    kelab: kelabAktif,
    murid: muridAktif,
    perjumpaan: perjumpaanBulanIni,
    laporanBelumIsi: laporanBelumIsi
  };
}

function getAmaranDashboard(token) {
  if (!semakSesi(token)) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const amaran = [];

  const sheetMurid = ss.getSheetByName('MURID_MASTER');
  const sheetKeahlian = ss.getSheetByName('KEAHLIAN');
  const dataMurid = sheetMurid.getDataRange().getValues()
    .slice(1).filter(function(r) { return r[8] === 'AKTIF'; });
  const dataKeahlian = sheetKeahlian.getDataRange()
    .getValues().slice(1);

  const muridAdaRumah = dataKeahlian
    .filter(function(r) { return r[2] === 'Rumah Sukan'; })
    .map(function(r) { return r[0]; });
  const muridTiadaRumah = dataMurid
    .filter(function(r) {
      return !muridAdaRumah.includes(r[0]);
    }).length;
  if (muridTiadaRumah > 0) {
    amaran.push(muridTiadaRumah +
      ' murid belum ditetapkan Rumah Sukan');
  }

  const muridT3T6 = dataMurid
    .filter(function(r) { return parseInt(r[2]) >= 3; });
  const muridAdaKelab = dataKeahlian
    .filter(function(r) {
      return r[2] === 'Kelab & Persatuan';
    }).map(function(r) { return r[0]; });
  const muridTiadaKelab = muridT3T6
    .filter(function(r) {
      return !muridAdaKelab.includes(r[0]);
    }).length;
  if (muridTiadaKelab > 0) {
    amaran.push(muridTiadaKelab +
      ' murid Tahun 3-6 belum ada Kelab & Persatuan');
  }

  return amaran;
}

function getPerjumpaanTerkini(token) {
  if (!semakSesi(token)) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetP = ss.getSheetByName('PERJUMPAAN');
  const sheetK = ss.getSheetByName('KELAB');

  const kelabMap = {};
  sheetK.getDataRange().getValues().slice(1)
    .forEach(function(r) {
      kelabMap[r[0]] = { nama: r[1], kategori: r[2] };
    });

  const bulanIni = new Date().getMonth();
  const tahunIni = new Date().getFullYear();

  return sheetP.getDataRange().getValues().slice(1)
    .filter(function(r) {
      if (!r[2]) return false;
      const t = new Date(r[2]);
      return t.getMonth() === bulanIni &&
             t.getFullYear() === tahunIni;
    })
    .slice(0, 10)
    .map(function(r) {
      return {
        namaKelab: kelabMap[r[1]] ?
          kelabMap[r[1]].nama : r[1],
        kategori: kelabMap[r[1]] ?
          kelabMap[r[1]].kategori : '',
        tarikh: tarikhKeString(r[2]),
        masa: masaKeString(r[3])
      };
    });
}

function getStatusLaporan(token) {
  if (!semakSesi(token)) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetP = ss.getSheetByName('PERJUMPAAN');
  const sheetL = ss.getSheetByName('LAPORAN_PERJUMPAAN');
  const sheetK = ss.getSheetByName('KELAB');

  const kelabMap = {};
  sheetK.getDataRange().getValues().slice(1)
    .forEach(function(r) { kelabMap[r[0]] = r[1]; });

  const idLaporan = sheetL.getDataRange().getValues()
    .slice(1).map(function(r) { return r[1]; });

  const bulanIni = new Date().getMonth();
  const tahunIni = new Date().getFullYear();

  return sheetP.getDataRange().getValues().slice(1)
    .filter(function(r) {
      if (!r[2]) return false;
      const t = new Date(r[2]);
      return t.getMonth() === bulanIni &&
             t.getFullYear() === tahunIni;
    })
    .slice(0, 10)
    .map(function(r) {
      return {
        namaKelab: kelabMap[r[1]] || r[1],
        tarikh: tarikhKeString(r[2]),
        status: idLaporan.includes(r[0]) ?
          'Lengkap' : 'Belum Diisi'
      };
    });
}

function kemaskiniTetapan(data, token) {
  const sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    var tetapanSedia = getTetapan();
    // Kekalkan SEMUA kunci sedia ada (cth: LOGO),
    // hanya tulis ganti medan yang diubah
    var tetapanBaru = {};
    for (var kunci in tetapanSedia) {
      tetapanBaru[kunci] = tetapanSedia[kunci];
    }
    tetapanBaru.NAMA_SEKOLAH = data.namaSekolah ||
      tetapanSedia.NAMA_SEKOLAH;
    tetapanBaru.KOD_SEKOLAH = data.kodSekolah ||
      tetapanSedia.KOD_SEKOLAH;
    tetapanBaru.TAHUN_AKADEMIK = data.tahunAkademik ||
      tetapanSedia.TAHUN_AKADEMIK;
    // JENIS_SEKOLAH dikunci selepas setup awal
    tetapanBaru.JENIS_SEKOLAH =
      tetapanSedia.JENIS_SEKOLAH || 'rendah';
    if (data.tahunKokuUnit !== undefined)
      tetapanBaru.TAHUN_KOKU_UNIT = data.tahunKokuUnit;
    if (data.tahunKokuKelab !== undefined)
      tetapanBaru.TAHUN_KOKU_KELAB = data.tahunKokuKelab;
    if (data.tahunKokuSukan !== undefined)
      tetapanBaru.TAHUN_KOKU_SUKAN = data.tahunKokuSukan;
    simpanTetapan(tetapanBaru);

    if (data.passAdminBaru) {
      tukarPassword('admin', data.passAdminBaru);
    }
    if (data.passGuruBaru) {
      tukarPassword('guru', data.passGuruBaru);
    }

    logAktiviti(sesi.id, 'KEMASKINI_TETAPAN',
      'Tetapan sistem dikemaskini');
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}

function tukarPassword(id, passwordBaru) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PENGGUNA');
  const data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 3)
           .setValue(hashPassword(passwordBaru));
      break;
    }
  }
}
// ============================================
// SIDEBAR SERVER-SIDE (v2.0)
// Link nav dijana oleh server dengan URL penuh —
// TIDAK bergantung pada JavaScript / google.script.run.
// Dipanggil dari setiap halaman:
//   <?!= renderSidebar(token, peranan) ?>
// ============================================

var VERSI_SISTEM = 'AKSI v1.1';

function renderSidebar(token, peranan) {
  var url = ScriptApp.getService().getUrl();
  var tetapan = getTetapan();
  var ikonSekolah = (tetapan && tetapan.LOGO) ?
    '<img src="' + tetapan.LOGO + '" style="width:42px;' +
    'height:42px;object-fit:contain;border-radius:8px;' +
    'background:#fff;padding:2px">' : '🏫';

  function pautan(page, ikon, label) {
    return '<a href="' + url + '?page=' + page +
      '&token=' + encodeURIComponent(token) +
      '" target="_top" class="nav-item" id="nav-' +
      page + '">' + ikon + ' ' + label + '</a>';
  }

  var html =
    '<script>window.URL_EXEC = "' + url +
    '";<' + '/script>' +
    '<div class="sidebar" id="sidebar">' +
    '<div class="sidebar-header">' +
    '<div class="sidebar-icon">' + ikonSekolah +
    '</div>' +
    '<div class="sidebar-nama">' +
    '<h3 id="sidebar-nama-sekolah">' +
    ((tetapan && tetapan.NAMA_SEKOLAH) || '') +
    '</h3>' +
    '<p id="sidebar-tahun">TA ' +
    ((tetapan && tetapan.TAHUN_AKADEMIK) || '') +
    '</p>' +
    '</div></div>' +
    '<nav class="sidebar-nav">' +
    pautan('Dashboard', '🏠', 'Dashboard') +
    pautan('Keahlian', '👥', 'Keahlian') +
    pautan('Kehadiran', '📅', 'Kehadiran') +
    pautan('Laporan', '📝', 'Laporan Perjumpaan') +
    pautan('Pencapaian', '🏅', 'Pencapaian') +
    pautan('Penilaian', '📋', 'Penilaian Koku') +
    pautan('Senarai', '⬇️', 'Muat Turun');

  if (peranan === 'admin') {
    html +=
      '<div id="menu-admin">' +
      '<div class="nav-divider">PENTADBIRAN</div>' +
      pautan('Admin', '⚙️', 'Tetapan &amp; Upload') +
      '</div>';
  }

  html +=
    '</nav>' +
    '<div class="sidebar-footer">' +
    '<button class="btn-logout" onclick="logout()">' +
    '🚪 Log Keluar</button>' +
    '<p style="text-align:center;font-size:10px;' +
    'color:#999;margin:8px 0 0 0">' +
    VERSI_SISTEM + '</p>' +
    '</div></div>' +
    '<div class="topbar">' +
    '<button class="btn-menu" onclick="togolSidebar()">' +
    '☰</button>' +
    '<h2 id="topbar-tajuk"></h2>' +
    '</div>';

  return html;
}

// ============================================
// JENIS SEKOLAH (v2.8): 'rendah' | 'menengah'
function getJenisSekolah() {
  try {
    var t = getTetapan();
    return (t && t.JENIS_SEKOLAH === 'menengah') ?
      'menengah' : 'rendah';
  } catch(e) {
    return 'rendah';
  }
}

// CACHE SENARAI (v3.3) — kurangkan bacaan sheet
function cacheDapatkan(kunci) {
  try {
    var c = CacheService.getScriptCache().get(kunci);
    return c ? JSON.parse(c) : null;
  } catch(e) { return null; }
}
function cacheSimpan(kunci, nilai, saat) {
  try {
    CacheService.getScriptCache().put(kunci,
      JSON.stringify(nilai), saat || 300);
  } catch(e) {}
}
function cacheBuang(kunci) {
  try {
    CacheService.getScriptCache().remove(kunci);
  } catch(e) {}
}

// TAHUN/TINGKATAN ADA KOKU IKUT KATEGORI (v3.0)
// TETAPAN simpan senarai dipisah koma, cth "4,5,6".
// Pulangkan null = semua tahun dibenarkan.
function getTahunKokuSet(kategori) {
  try {
    var t = getTetapan() || {};
    var peta = {
      'Unit Beruniform': t.TAHUN_KOKU_UNIT,
      'Kelab & Persatuan': t.TAHUN_KOKU_KELAB,
      'Sukan & Permainan': t.TAHUN_KOKU_SUKAN
    };
    if (!(kategori in peta)) return null;
    var nilai = peta[kategori];
    if (nilai === undefined || nilai === null) {
      // Serasi ke belakang: TAHUN_MULA_* (v2.9)
      var petaLama = {
        'Unit Beruniform': t.TAHUN_MULA_UNIT,
        'Kelab & Persatuan': t.TAHUN_MULA_KELAB,
        'Sukan & Permainan': t.TAHUN_MULA_SUKAN
      };
      var mula = parseInt(petaLama[kategori], 10);
      if (mula >= 2) {
        var s = [];
        for (var n = mula; n <= 6; n++)
          s.push(String(n));
        return s;
      }
      return null;
    }
    return String(nilai).split(',')
      .map(function(x) { return x.trim(); })
      .filter(function(x) { return x !== ''; });
  } catch(e) {
    return null;
  }
}

function bolehSertaiKategori(kategori, tahunMurid) {
  var set = getTahunKokuSet(kategori);
  if (set === null) return true;
  return set.indexOf(String(Number(tahunMurid))) !== -1;
}

// HELPER PERBANDINGAN NILAI (v2.1)
// Sheets simpan IC 12-digit & tahun sebagai NOMBOR,
// manakala nilai dari browser tiba sebagai STRING.
// Perbandingan === terus akan gagal — guna ini.
// ============================================
function samaNilai(a, b) {
  var sA = (a === null || a === undefined) ?
    '' : String(a).trim();
  var sB = (b === null || b === undefined) ?
    '' : String(b).trim();
  return sA !== '' && sA === sB;
}


// ============================================
// LOGO SEKOLAH (v2.3)
// ============================================
function simpanLogo(dataUrl, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  try {
    if (dataUrl && dataUrl.length > 45000) {
      return { berjaya: false,
               mesej: 'Logo terlalu besar.' };
    }
    var tetapan = getTetapan();
    tetapan.LOGO = dataUrl || '';
    simpanTetapan(tetapan);
    logAktiviti(sesi.id, 'TUKAR_LOGO',
      'Logo sekolah dikemaskini');
    return { berjaya: true };
  } catch(e) {
    return { berjaya: false, mesej: e.toString() };
  }
}


// ============================================
// API POST KALIS-COOKIE (v2.4)
// Dipanggil oleh ApiShim.html melalui fetch.
// Keselamatan: hanya fungsi dalam senarai putih
// boleh dipanggil; setiap fungsi tetap menyemak
// token/peranan sendiri seperti biasa.
// ============================================
var API_DIBENARKAN = [
  'login', 'logout', 'getTetapan', 'getScriptUrl',
  'getDashboardSemua',
  'getStatistikDashboard', 'getAmaranDashboard',
  'getPerjumpaanTerkini', 'getStatusLaporan',
  'kemaskiniTetapan', 'simpanLogo',
  'importMurid', 'exportTemplateKoku',
  'importKeahlian', 'getSenaraiMurid',
  'getSenaraiKelab', 'getSenaraiKelabPenuh',
  'tambahKelab', 'togolStatusKelab', 'padamKelab',
  'getSenaraiGuru', 'tambahGuru', 'padamGuru',
  'buatPerjumpaan', 'getPerjumpaanKelab',
  'getKehadiran', 'simpanKehadiran',
  'padamPerjumpaan',
  'simpanLaporan', 'getLaporan', 'padamLaporan',
  'tambahPencapaian', 'getSenaraiPencapaian',
  'padamPencapaian',
  'simpanKomitmen', 'simpanKhidmat',
  'simpanPenglibatan', 'simpanJawatan',
  'getPenilaianMurid', 'simpanEkstra',
  'getEkstraMurid', 'getSenaraiJawatanKelab',
  'getMarkahPenglibatan', 'getAhliKelab',
  'getKeahlianMuridPenilaian',
  'kiraPAJSK', 'getSenaraiPAJSK',
  'getAnggaranMurid', 'getAnggaranKelas',
  'simpanAnggaranKeRekod',
  'getPeneranganGred',
  'getDataKeahlianKelab', 'cariMuridUntukKeahlian',
  'tukarJenisKelab', 'getSenaraiJenisKoku',
  'importGuru',
  'getSemakanKeahlian', 'tukarKelabAhli',
  'tambahAhliKelab', 'tukarJawatanAhli',
  'buangAhliKelab', 'padamKeahlianKekal',
  'getSenaraiKelasAktif', 'getSenaraiIkutKelas',
  'getStatusArkib', 'tutupTahunAkademik',
  'buatBackupManual', 'togolBackupAutomatik',
  'jalankanSetup', 'semakSetup'
];

function doPost(e) {
  var jawapan;
  try {
    var req = JSON.parse(e.postData.contents);
    if (API_DIBENARKAN.indexOf(req.fn) === -1) {
      jawapan = { ok: false,
                  ralat: 'Fungsi tidak dibenarkan.' };
    } else {
      var fungsi = this[req.fn];
      if (typeof fungsi !== 'function') {
        jawapan = { ok: false,
                    ralat: 'Fungsi tidak dijumpai.' };
      } else {
        var hasil = fungsi.apply(null, req.args || []);
        jawapan = { ok: true, hasil: hasil };
      }
    }
  } catch (err) {
    jawapan = { ok: false, ralat: err.toString() };
  }
  return ContentService
    .createTextOutput(JSON.stringify(jawapan))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================
// DASHBOARD SATU PANGGILAN (v2.5) — gabung 4
// permintaan berasingan kepada 1 untuk kelajuan
// ============================================
function getDashboardSemua(token) {
  if (!semakSesi(token)) return null;
  return {
    statistik: getStatistikDashboard(token),
    amaran: getAmaranDashboard(token),
    perjumpaan: getPerjumpaanTerkini(token),
    laporan: getStatusLaporan(token)
  };
}


// ============================================
// MENU UTILITI DALAM GOOGLE SHEETS (v3.9)
// Muncul di bar menu Sheets (sebelah Help)
// untuk sesiapa yang ada akses edit fail ini.
// ============================================
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🛠️ Utiliti Sistem')
      .addItem('🔑 Reset Password Admin',
        'menuResetPasswordAdmin')
      .addItem('🔑 Reset Password Guru',
        'menuResetPasswordGuru')
      .addToUi();
  } catch(e) {}
}

function menuResetPasswordAdmin() {
  menuResetPassword_('admin');
}

function menuResetPasswordGuru() {
  menuResetPassword_('guru');
}

// Nama berakhir _ = tidak boleh dipanggil dari web
function menuResetPassword_(peranan) {
  var ui = SpreadsheetApp.getUi();

  var jawab = ui.alert('⚠️ Amaran',
    'Anda akan menukar password ' +
    peranan.toUpperCase() + '.\n' +
    'Semua pengguna ' + peranan +
    ' perlu log masuk semula dengan password baru.' +
    '\n\nTeruskan?',
    ui.ButtonSet.OK_CANCEL);
  if (jawab !== ui.Button.OK) return;

  var res = ui.prompt(
    'Password Baru (' + peranan + ')',
    'Masukkan password baru (min. 4 aksara):',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;

  var baru = res.getResponseText().trim();
  if (baru.length < 4) {
    ui.alert('Gagal',
      'Password mesti sekurang-kurangnya 4 aksara. ' +
      'Cuba lagi.', ui.ButtonSet.OK);
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('PENGGUNA');
  if (!sheet) {
    ui.alert('Gagal', 'Sheet PENGGUNA tidak dijumpai.',
      ui.ButtonSet.OK);
    return;
  }
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === peranan) {
      sheet.getRange(i + 1, 3)
        .setValue(hashPassword(baru));
      logAktiviti(peranan, 'RESET_PASSWORD',
        'Melalui menu Utiliti Sheets');
      ui.alert('✅ Berjaya',
        'Password ' + peranan + ' telah ditukar. ' +
        'Sila log masuk dengan password baru.',
        ui.ButtonSet.OK);
      return;
    }
  }
  ui.alert('Gagal', 'Pengguna "' + peranan +
    '" tidak dijumpai.', ui.ButtonSet.OK);
}
