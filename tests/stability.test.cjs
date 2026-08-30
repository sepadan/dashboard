const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const raw = fs.readFileSync(path.join(root, 'data.json'), 'utf8');
const data = JSON.parse(raw);

const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
function object(value, pointer) {
  assert.ok(isObject(value), `${pointer} mesti objek`);
}
function keys(value, pointer, allowed, required = allowed) {
  object(value, pointer);
  const extra = Object.keys(value).filter(key => !allowed.includes(key));
  assert.deepEqual(extra, [], `${pointer} mengandungi medan di luar kontrak`);
  required.forEach(key => assert.ok(Object.hasOwn(value, key), `${pointer}.${key} wajib ada`));
}
function scalar(value, pointer, type, nullable = false) {
  if (nullable && value === null) return;
  assert.equal(typeof value, type, `${pointer} mesti ${type}`);
  if (type === 'number') assert.ok(Number.isFinite(value), `${pointer} mesti nombor terhingga`);
}
function rows(value, pointer, spec, required = Object.keys(spec)) {
  assert.ok(Array.isArray(value), `${pointer} mesti tatasusunan`);
  value.forEach((row, i) => {
    const p = `${pointer}[${i}]`;
    keys(row, p, Object.keys(spec), required);
    for (const [key, type] of Object.entries(spec)) {
      if (Object.hasOwn(row, key)) scalar(row[key], `${p}.${key}`, type.replace('?', ''), type.endsWith('?'));
    }
  });
}
function validateAcademic(a, pointer, lengkap = true) {
  const allowed = ['gps', 'peratus_lulus', 'peperiksaan', 'mata_pelajaran', 'trend_gps',
    'pbd_tahap', 'ikut_kelas', 'peperiksaan_semua', 'sumber_semak'];
  keys(a, pointer, allowed, lengkap ? ['gps', 'peratus_lulus', 'mata_pelajaran', 'trend_gps', 'pbd_tahap'] : []);
  if ('gps' in a) scalar(a.gps, `${pointer}.gps`, 'number');
  if ('peratus_lulus' in a) scalar(a.peratus_lulus, `${pointer}.peratus_lulus`, 'number');
  if ('peperiksaan' in a) scalar(a.peperiksaan, `${pointer}.peperiksaan`, 'string');
  if ('mata_pelajaran' in a) rows(a.mata_pelajaran, `${pointer}.mata_pelajaran`,
    { mp: 'string', gpmp: 'number', peratus_a: 'number', peratus_lulus: 'number' });
  if ('trend_gps' in a) rows(a.trend_gps, `${pointer}.trend_gps`,
    { penilaian: 'string', penilaian_penuh: 'string', gps: 'number' }, ['penilaian', 'gps']);
  if ('pbd_tahap' in a) rows(a.pbd_tahap, `${pointer}.pbd_tahap`, { tahap: 'string', bilangan: 'number' });
  if ('ikut_kelas' in a) rows(a.ikut_kelas, `${pointer}.ikut_kelas`,
    { kelas: 'string', gps: 'number', peratus_lulus: 'number', murid: 'number' });
  if ('peperiksaan_semua' in a) {
    assert.ok(Array.isArray(a.peperiksaan_semua), `${pointer}.peperiksaan_semua mesti tatasusunan`);
    a.peperiksaan_semua.forEach((blok, i) => validateAcademic(blok, `${pointer}.peperiksaan_semua[${i}]`, false));
  }
  if ('sumber_semak' in a) {
    keys(a.sumber_semak, `${pointer}.sumber_semak`, ['peperiksaan', 'murid', 'rekod', 'luar_main']);
    scalar(a.sumber_semak.peperiksaan, `${pointer}.sumber_semak.peperiksaan`, 'string');
    ['murid', 'rekod', 'luar_main'].forEach(k => scalar(a.sumber_semak[k], `${pointer}.sumber_semak.${k}`, 'number'));
  }
}
function validateDashboard(candidate) {
  keys(candidate, '$', ['sekolah', 'sesi_semasa', 'sesi']);
  keys(candidate.sekolah, '$.sekolah', ['nama', 'kod', 'daerah', 'singkatan', 'logo', 'dikemaskini'], ['nama']);
  Object.entries(candidate.sekolah).forEach(([k, v]) => scalar(v, `$.sekolah.${k}`, 'string'));
  scalar(candidate.sesi_semasa, '$.sesi_semasa', 'string');
  object(candidate.sesi, '$.sesi');
  assert.ok(candidate.sesi[candidate.sesi_semasa], 'sesi_semasa mesti merujuk sesi yang wujud');
  for (const [tahun, sesi] of Object.entries(candidate.sesi)) {
    const p = `$.sesi.${tahun}`;
    keys(sesi, p, ['enrolmen', 'kehadiran', 'akademik', 'hem', 'kokurikulum']);
    keys(sesi.enrolmen, `${p}.enrolmen`, ['ikut_tahun', 'ikut_kaum', 'guru', 'staf_sokongan', 'kelas']);
    rows(sesi.enrolmen.ikut_tahun, `${p}.enrolmen.ikut_tahun`, { tahun: 'string', lelaki: 'number', perempuan: 'number' });
    rows(sesi.enrolmen.ikut_kaum, `${p}.enrolmen.ikut_kaum`, { kaum: 'string', bilangan: 'number' });
    ['guru', 'staf_sokongan', 'kelas'].forEach(k => scalar(sesi.enrolmen[k], `${p}.enrolmen.${k}`, 'number'));
    keys(sesi.kehadiran, `${p}.kehadiran`, ['bulanan', 'ikut_kelas', 'hari_ini']);
    rows(sesi.kehadiran.bulanan, `${p}.kehadiran.bulanan`, { bulan: 'string', murid: 'number', guru: 'number' }, ['bulan', 'murid']);
    rows(sesi.kehadiran.ikut_kelas, `${p}.kehadiran.ikut_kelas`, { kelas: 'string', peratus: 'number' });
    if (sesi.kehadiran.hari_ini !== null) {
      const hi = sesi.kehadiran.hari_ini;
      keys(hi, `${p}.kehadiran.hari_ini`, ['tidak_hadir', 'hadir', 'peratus', 'ditanda', 'dikemaskini', 'ikut_kelas'],
        ['tidak_hadir', 'hadir', 'peratus', 'ditanda']);
      ['tidak_hadir', 'hadir', 'peratus', 'ditanda'].forEach(k => scalar(hi[k], `${p}.kehadiran.hari_ini.${k}`, 'number'));
      if ('dikemaskini' in hi) scalar(hi.dikemaskini, `${p}.kehadiran.hari_ini.dikemaskini`, 'string');
      if ('ikut_kelas' in hi) rows(hi.ikut_kelas, `${p}.kehadiran.hari_ini.ikut_kelas`,
        { kelas: 'string', tidak_hadir: 'number', hadir: 'number', peratus: 'number', ditanda: 'number' }, ['kelas', 'tidak_hadir']);
    }
    validateAcademic(sesi.akademik, `${p}.akademik`);
    keys(sesi.hem, `${p}.hem`, ['kepimpinan', 'bantuan', 'profil_murid']);
    rows(sesi.hem.kepimpinan, `${p}.hem.kepimpinan`, { jawatan: 'string', murid: 'number' });
    rows(sesi.hem.bantuan, `${p}.hem.bantuan`, { jenis: 'string', murid: 'number' });
    rows(sesi.hem.profil_murid, `${p}.hem.profil_murid`, { perkara: 'string', bilangan: 'number' });
    keys(sesi.kokurikulum, `${p}.kokurikulum`,
      ['peratus_penyertaan', 'ikut_bidang', 'pencapaian', 'rumah_sukan', 'perjumpaan', 'sumber_aksi'],
      ['peratus_penyertaan', 'ikut_bidang', 'pencapaian']);
    scalar(sesi.kokurikulum.peratus_penyertaan, `${p}.kokurikulum.peratus_penyertaan`, 'number');
    rows(sesi.kokurikulum.ikut_bidang, `${p}.kokurikulum.ikut_bidang`, { bidang: 'string', murid: 'number' });
    rows(sesi.kokurikulum.pencapaian, `${p}.kokurikulum.pencapaian`, { peringkat: 'string', bilangan: 'number' });
    if ('rumah_sukan' in sesi.kokurikulum) rows(sesi.kokurikulum.rumah_sukan, `${p}.kokurikulum.rumah_sukan`, { rumah: 'string', murid: 'number' });
    if ('perjumpaan' in sesi.kokurikulum) {
      const q = sesi.kokurikulum.perjumpaan;
      keys(q, `${p}.kokurikulum.perjumpaan`, ['bil', 'purata_kehadiran', 'kelab_aktif', 'laporan_belum', 'ikut_kelab']);
      ['bil', 'kelab_aktif', 'laporan_belum'].forEach(k => scalar(q[k], `${p}.kokurikulum.perjumpaan.${k}`, 'number'));
      scalar(q.purata_kehadiran, `${p}.kokurikulum.perjumpaan.purata_kehadiran`, 'number', true);
      rows(q.ikut_kelab, `${p}.kokurikulum.perjumpaan.ikut_kelab`, { kelab: 'string', perjumpaan: 'number', peratus_hadir: 'number?' });
    }
    if ('sumber_aksi' in sesi.kokurikulum) {
      const s = sesi.kokurikulum.sumber_aksi;
      keys(s, `${p}.kokurikulum.sumber_aksi`, ['tahun', 'ahli', 'kelab', 'pencapaian', 'asas', 'luar_main', 'rumah_sukan', 'bukan_layak', 'layak']);
      ['tahun', 'asas'].forEach(k => scalar(s[k], `${p}.kokurikulum.sumber_aksi.${k}`, 'string'));
      ['ahli', 'kelab', 'pencapaian', 'luar_main', 'rumah_sukan', 'bukan_layak', 'layak'].forEach(k => scalar(s[k], `${p}.kokurikulum.sumber_aksi.${k}`, 'number'));
    }
  }
  const mentah = JSON.stringify(candidate);
  assert.doesNotMatch(mentah, /\b\d{6}[- ]?\d{2}[- ]?\d{4}\b/, 'data awam tidak boleh mengandungi IC/MyKad');
}
validateDashboard(data);

const clone = () => structuredClone(data);
const kosong = clone(); kosong.sesi[kosong.sesi_semasa] = {};
assert.throws(() => validateDashboard(kosong), /wajib ada/, 'Sesi tanpa lima domain mesti ditolak');
const namaIndividu = clone(); namaIndividu.sesi[namaIndividu.sesi_semasa].kehadiran.senarai_tidak_hadir = [{ nama: 'Murid Contoh' }];
assert.throws(() => validateDashboard(namaIndividu), /di luar kontrak/, 'Senarai individu tidak hadir mesti ditolak');
const icBerformat = clone(); icBerformat.sekolah.kod = '120101-01-1234';
assert.throws(() => validateDashboard(icBerformat), /IC\/MyKad/, 'IC bersengkang mesti dikesan');
const icTanpaPemisah = clone(); icTanpaPemisah.sekolah.kod = '120101011234';
assert.throws(() => validateDashboard(icTanpaPemisah), /IC\/MyKad/, 'IC 12 digit tanpa pemisah mesti dikesan');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1].trim())
  .filter(Boolean);
assert.ok(scripts.length > 0, 'Skrip Dashboard tidak ditemui');
scripts.forEach((source, i) => {
  assert.doesNotThrow(() => new Function(source),
    `Blok skrip sebaris ${i + 1} mesti sah`);
});

assert.match(html, /const esc =/,
  'Dashboard mesti mempunyai pelolos HTML berpusat');
assert.match(html, /function tableHTML[\s\S]*esc\(/,
  'Paparan jadual mesti melolos nilai daripada JSON');
assert.match(html, /fetch\(url,\s*\{cache:'no-store'\}\)/,
  'Dashboard hos mesti mendapatkan data semasa tanpa cache pelayar lapuk');

console.log('Ujian Dashboard lulus: JSON sah, kontrak sesi lengkap, tiada PII dan skrip sebaris sah.');
