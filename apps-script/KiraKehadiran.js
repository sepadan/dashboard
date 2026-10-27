function kiraKehadiran_(ss, tetapan) {
  var s = ss.getSheetByName('kehadiran');
  var hasil = { bulanan: [], ikut_kelas: [], harian: [], hari_ini: null };
  if (!s || s.getLastRow() < 2) return hasil;

  var data = s.getRange(1, 1, s.getLastRow(), Math.max(s.getLastColumn(), 4)).getDisplayValues();
  var kepala = data[0];
  var bulanKira = Object.create(null);   // bulan -> {hadir, jumlah}
  var kelasKira = Object.create(null);   // kelas -> {hadir, jumlah}
  var guruBulanan = petaGuruBulanan_(ss);

  for (var c = 4; c < kepala.length; c++) {
    var t = String(kepala[c] || '').trim();
    var m = t.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!m) continue;
    var bulan = ('0' + m[2]).slice(-2);
    if (!bulanKira[bulan]) bulanKira[bulan] = { hadir: 0, jumlah: 0 };

    for (var r = 1; r < data.length; r++) {
      var nilai = String(data[r][c] || '').trim();
      if (nilai !== '1' && nilai !== '0') continue;      // '' dan '—' diabaikan
      var kelas = String(data[r][2] || '').trim();
      if (!kelasKira[kelas]) kelasKira[kelas] = { hadir: 0, jumlah: 0 };
      bulanKira[bulan].jumlah++;
      kelasKira[kelas].jumlah++;
      if (nilai === '1') { bulanKira[bulan].hadir++; kelasKira[kelas].hadir++; }
    }
  }

  hasil.bulanan = Object.keys(bulanKira).sort().map(function(b) {
    var o = bulanKira[b];
    var baris = { bulan: DASH_BULAN[b] || b, murid: peratus_(o.hadir, o.jumlah) };
    if (guruBulanan[b] !== undefined) baris.guru = guruBulanan[b];
    return baris;
  });

  hasil.ikut_kelas = Object.keys(kelasKira).filter(function(k) { return k; }).sort().map(function(k) {
    return { kelas: k, peratus: peratus_(kelasKira[k].hadir, kelasKira[k].jumlah) };
  });

  var hariIni = Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd');
  var interval = dapatkanIntervalArkib_(), aktif = dapatkanIcAktifMain_();
  hasil.harian = agregatKehadiranHarian_(data, kepala,
    tetapan.sesi || Utilities.formatDate(new Date(), 'GMT+8', 'yyyy'), hariIni,
    function (row, iso) { return !muridTiadaPadaTarikh_(row[3], iso, interval, aktif); });
  var terkini = hasil.harian.filter(function (r) { return r.tarikh === hariIni; })[0];
  hasil.hari_ini = terkini && terkini.ditanda ? {
    tarikh: terkini.tarikh,
    dikemaskini: Utilities.formatDate(new Date(), 'GMT+8', 'HH:mm'),
    hadir: terkini.hadir, tidak_hadir: terkini.tidak_hadir, ditanda: terkini.ditanda,
    peratus: terkini.peratus,
    ikut_kelas: terkini.ikut_kelas.filter(function (r) { return r.tidak_hadir > 0; }).map(function (r) {
      return { kelas:r.kelas, tidak_hadir:r.tidak_hadir, ditanda:r.ditanda };
    })
  } : null;
  return hasil;
}

