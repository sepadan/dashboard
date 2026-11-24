// Ujian privasi halaman awam Dialog Prestasi Matematik (peraturan 3.1).
// Halaman ini hanya boleh membawa angka agregat: tiada nama, IC atau markah individu.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'dialog-matematik', 'index.html'), 'utf8');

// 1. Tiada IC/MyKad 12 digit (termasuk bersengkang atau berjarak)
assert.ok(!/\d{6}[-\s]?\d{2}[-\s]?\d{4}/.test(html), 'IC 12 digit ditemui');

// 2. Tiada nama murid (penanda nama Melayu)
assert.ok(!/\b(BIN|BINTI|A\/L|A\/P)\b/.test(html), 'Penanda nama murid ditemui');

// 3. Data terbenam hanya mengandungi medan agregat yang dibenarkan
const m = html.match(/const D = (\{.*?\});\n/);
assert.ok(m, 'Blok data agregat tidak ditemui');
const D = JSON.parse(m[1]);
const KELAS = new Set(['id','nama','uasaFile','n','dist','avgTP','oth','hasU','cat','jan','grd','uAvg','lulus','cplus','nu','gap','jx']);
const JUMLAH = new Set(['n','dist','avgTP','uN','uAvg','lulus','cplus','ef','gap','tp4u','cat','tp4','tp56']);
for (const k of D.K) {
  for (const key of Object.keys(k)) assert.ok(KELAS.has(key), `Medan kelas luar kontrak: ${key}`);
  assert.ok(!Array.isArray(k.s), 'Senarai murid individu tidak dibenarkan');
  // Purata bagi kumpulan kecil (< 3 murid) mesti disembunyikan supaya markah individu tidak terdedah
  for (const r of k.jx || []) if (r.C + r.S + r.L < 3) assert.equal(r.avg, null, `Purata kumpulan kecil terdedah: ${k.nama} TP${r.t}`);
}
for (const key of Object.keys(D.T)) assert.ok(JUMLAH.has(key), `Medan jumlah luar kontrak: ${key}`);

console.log('dialog-matematik: lulus');
