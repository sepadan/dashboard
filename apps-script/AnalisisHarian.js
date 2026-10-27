/** Analisis kehadiran harian. Baca sahaja; hanya agregat boleh diterbitkan. */
function agregatKehadiranHarian_(data, kepala, sesi, hariIni, layak) {
  var tahun = Number(sesi), rekod = Object.create(null);
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) return [];
  for (var c = 4; c < kepala.length; c++) {
    var m = String(kepala[c] || '').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2}|\d{4}))?$/);
    if (!m) continue;
    var y = m[3] ? Number(m[3]) : tahun;
    if (y < 100) y += 2000;
    var d = Number(m[1]), b = Number(m[2]), sah = new Date(Date.UTC(y, b - 1, d));
    if (y !== tahun || sah.getUTCFullYear() !== y || sah.getUTCMonth() !== b - 1 || sah.getUTCDate() !== d) continue;
    var iso = String(y) + '-' + ('0' + b).slice(-2) + '-' + ('0' + d).slice(-2);
    if (iso > hariIni || rekod[iso]) continue;
    var kelas = Object.create(null);
    for (var r = 1; r < data.length; r++) {
      var row = data[r], k = String(row[2] || '').trim() || '(tiada kelas)';
      if (!String(row[1] || '').trim() && !String(row[3] || '').trim()) continue;
      var nilai = String(row[c] == null ? '' : row[c]).trim();
      if (nilai === '—' || nilai === '-') continue; // tidak layak pada tarikh ini
      if (layak && !layak(row, iso)) continue;
      if (!kelas[k]) kelas[k] = { kelas:k, hadir:0, tidak_hadir:0, ditanda:0, belum_ditanda:0, jumlah:0, peratus:null };
      var o = kelas[k]; o.jumlah++;
      if (nilai === '1') { o.hadir++; o.ditanda++; }
      else if (nilai === '0') { o.tidak_hadir++; o.ditanda++; }
      else o.belum_ditanda++; // nilai tidak dikenali tidak dianggap hadir/tidak hadir
    }
    var out = { tarikh:iso, hadir:0, tidak_hadir:0, ditanda:0, belum_ditanda:0, jumlah:0, peratus:null, ikut_kelas:[] };
    Object.keys(kelas).sort().forEach(function (k) {
      var o = kelas[k];
      o.peratus = o.ditanda ? Math.round(o.hadir / o.ditanda * 1000) / 10 : null;
      ['hadir','tidak_hadir','ditanda','belum_ditanda','jumlah'].forEach(function (f) { out[f] += o[f]; });
      out.ikut_kelas.push(o);
    });
    out.peratus = out.ditanda ? Math.round(out.hadir / out.ditanda * 1000) / 10 : null;
    rekod[iso] = out;
  }
  return Object.keys(rekod).sort().map(function (k) { return rekod[k]; });
}
