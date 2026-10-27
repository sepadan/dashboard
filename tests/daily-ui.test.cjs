const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Ekstrak skrip daripada index.html
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1].trim())
  .filter(Boolean);

// Sediakan sandbox minimal untuk memuatkan fungsi-fungsi Dashboard
function ciptaKonteks(dataTambahan = {}) {
  const listeners = {};
  const elMap = new Map();

  function mockElement(id = '') {
    if (id && elMap.has(id)) return elMap.get(id);
    const elListeners = {};
    const el = {
      id,
      appendChild: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      removeAttribute: () => {},
      addEventListener: (evt, fn) => {
        if (!elListeners[evt]) elListeners[evt] = [];
        elListeners[evt].push(fn);
      },
      removeEventListener: () => {},
      dispatchEvent: (evt) => {
        const type = typeof evt === 'string' ? evt : evt.type;
        const e = typeof evt === 'string' ? { target: el, type: evt } : { target: el, ...evt };
        (elListeners[type] || []).forEach(fn => fn(e));
      },
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      style: {},
      innerHTML: '',
      textContent: '',
      children: [],
      contains: () => false,
      querySelector: (sel) => {
        if (sel && sel.startsWith('#')) return mockElement(sel.slice(1));
        return mockElement();
      },
      querySelectorAll: () => [],
      closest: () => null,
      replaceWith: () => {},
      value: '',
      dataset: {},
      hidden: false
    };
    el.firstChild = el;
    if (id) elMap.set(id, el);
    return el;
  }

  const ctx = {
    console,
    Math,
    Intl,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    RegExp,
    parseFloat,
    parseInt,
    isFinite,
    isNaN,
    setTimeout: (fn) => typeof fn === 'function' && fn(),
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => typeof fn === 'function' && fn(),
    document: {
      createElement: () => mockElement(),
      getElementById: (id) => mockElement(id),
      querySelector: (sel) => (sel && sel.startsWith('#') ? mockElement(sel.slice(1)) : mockElement()),
      querySelectorAll: () => [],
      documentElement: mockElement('html'),
      body: mockElement('body'),
      addEventListener: (evt, fn) => { listeners[evt] = fn; },
      title: ''
    },
    window: {
      print: () => {}
    },
    location: {
      search: '',
      protocol: 'file:'
    },
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ paddingLeft: '0', paddingRight: '0', paddingTop: '0', paddingBottom: '0', getPropertyValue: () => '' }),
    addEventListener: (evt, fn) => { listeners[evt] = fn; },
    fetch: () => Promise.resolve({ ok: false }),
    URLSearchParams: class {
      get() { return null; }
    },
    ...dataTambahan
  };

  const context = vm.createContext(ctx);
  // Jalankan skrip dalam index.html
  vm.runInContext(scripts[0] + '\nglobalThis.STATE=STATE;globalThis.REG=REG;Object.defineProperty(globalThis,"DATA",{get:()=>DATA,set:v=>DATA=v});', context);
  return context;
}

test('Fungsi ketulenan harian diekstrak dengan betul', (t) => {
  const ctx = ciptaKonteks();
  assert.equal(typeof ctx.dapatkanSenaraiHarian, 'function', 'dapatkanSenaraiHarian mesti fungsi');
  assert.equal(typeof ctx.dapatkanTarikhTersedia, 'function', 'dapatkanTarikhTersedia mesti fungsi');
  assert.equal(typeof ctx.dapatkanBulanTersedia, 'function', 'dapatkanBulanTersedia mesti fungsi');
  assert.equal(typeof ctx.pilihRekodHarian, 'function', 'pilihRekodHarian mesti fungsi');
  assert.equal(typeof ctx.pilihTarikhTerkiniBulan, 'function', 'pilihTarikhTerkiniBulan mesti fungsi');
  assert.equal(typeof ctx.formatTarikhPaparan, 'function', 'formatTarikhPaparan mesti fungsi');
  assert.equal(typeof ctx.analisisHarian, 'function', 'analisisHarian mesti fungsi');
  assert.equal(typeof ctx.cfgTrendHarian, 'function', 'cfgTrendHarian mesti fungsi');
  assert.equal(typeof ctx.cfgPecahanKelasHarian, 'function', 'cfgPecahanKelasHarian mesti fungsi');
  assert.equal(typeof ctx.bersihkanKad, 'function', 'bersihkanKad mesti fungsi');
});

test('dapatkanSenaraiHarian mengendalikan susunan ascending dan kes tiada data', () => {
  const ctx = ciptaKonteks();
  const rawHarian = [
    { tarikh: '2026-10-27', hadir: 220, tidak_hadir: 4, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 98.2 },
    { tarikh: '2026-09-30', hadir: 215, tidak_hadir: 9, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 96.0 },
    { tarikh: '2026-10-01', hadir: 218, tidak_hadir: 6, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 97.3 }
  ];
  const sesi = { kehadiran: { harian: rawHarian } };
  const hasil = ctx.dapatkanSenaraiHarian(sesi.kehadiran);
  assert.equal(hasil.length, 3);
  assert.equal(hasil[0].tarikh, '2026-09-30');
  assert.equal(hasil[1].tarikh, '2026-10-01');
  assert.equal(hasil[2].tarikh, '2026-10-27');

  // Kes kosong / tiada harian
  assert.equal(ctx.dapatkanSenaraiHarian({}).length, 0);
  assert.equal(ctx.dapatkanSenaraiHarian(null).length, 0);
});

test('dapatkanTarikhTersedia dan dapatkanBulanTersedia', () => {
  const ctx = ciptaKonteks();
  const harian = [
    { tarikh: '2026-09-29' },
    { tarikh: '2026-09-30' },
    { tarikh: '2026-10-01' },
    { tarikh: '2026-10-27' }
  ];
  assert.deepEqual(ctx.dapatkanTarikhTersedia(harian), [
    '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-27'
  ]);
  assert.deepEqual(ctx.dapatkanBulanTersedia(harian), [
    '2026-09', '2026-10'
  ]);
});

test('pilihRekodHarian memulangkan rekod pilihan atau lalai terkini', () => {
  const ctx = ciptaKonteks();
  const harian = [
    { tarikh: '2026-09-30', hadir: 215 },
    { tarikh: '2026-10-27', hadir: 220 }
  ];
  assert.equal(ctx.pilihRekodHarian(harian, '2026-09-30').hadir, 215);
  // Bila tarikh tiada atau null, pulangkan tarikh terkini (2026-10-27)
  assert.equal(ctx.pilihRekodHarian(harian, '2026-10-15').hadir, 220);
  assert.equal(ctx.pilihRekodHarian(harian, null).hadir, 220);
  assert.equal(ctx.pilihRekodHarian([], '2026-10-27'), null);
});

test('Koheren tarikh dan bulan: pilihTarikhTerkiniBulan', () => {
  const ctx = ciptaKonteks();
  const harian = [
    { tarikh: '2026-09-28' },
    { tarikh: '2026-09-30' },
    { tarikh: '2026-10-01' },
    { tarikh: '2026-10-27' }
  ];
  // Menukar bulan ke September memilih hari terakhir bulan tersebut iaitu 2026-09-30
  assert.equal(ctx.pilihTarikhTerkiniBulan(harian, '2026-09'), '2026-09-30');
  assert.equal(ctx.pilihTarikhTerkiniBulan(harian, '2026-10'), '2026-10-27');
});

test('formatTarikhPaparan memformat tarikh dan bulan ke Bahasa Melayu', () => {
  const ctx = ciptaKonteks();
  assert.equal(ctx.formatTarikhPaparan('2026-10-27'), '27 Okt 2026');
  assert.equal(ctx.formatTarikhPaparan('2026-10'), 'Oktober 2026');
  assert.equal(ctx.formatTarikhPaparan('2026-09-05'), '5 Sep 2026');
});

test('analisisHarian memberikan analisis jujur: amaran belum lengkap & tiada 100% jika belum ditanda', () => {
  const ctx = ciptaKonteks();

  // Kes 1: Semua ditanda hadir tetapi ada kelas/murid belum ditanda
  const rekodSepara = {
    tarikh: '2026-10-27',
    hadir: 200,
    tidak_hadir: 0,
    ditanda: 200,
    belum_ditanda: 24,
    jumlah: 224,
    peratus: 100.0,
    ikut_kelas: [
      { kelas: '1 BIJAK', hadir: 28, tidak_hadir: 0, ditanda: 28, belum_ditanda: 0, jumlah: 28, peratus: 100.0 },
      { kelas: '6 BIJAK', hadir: 0, tidak_hadir: 0, ditanda: 0, belum_ditanda: 24, jumlah: 24, peratus: null }
    ]
  };
  const a1 = ctx.analisisHarian(rekodSepara);
  assert.equal(a1.boleh100, false, 'Tidak boleh claim 100% jika belum ditanda');
  assert.ok(a1.amaran.includes('belum lengkap') || a1.amaran.includes('Belum lengkap'), 'Mesti ada amaran belum lengkap');
  assert.ok(a1.amaran.includes('24'), 'Mesti menyatakan bilangan murid/rekod belum ditanda');

  // Kes 2: Lengkap ditanda dengan ketidakhadiran tertinggi
  const rekodLengkap = {
    tarikh: '2026-10-27',
    hadir: 215,
    tidak_hadir: 9,
    ditanda: 224,
    belum_ditanda: 0,
    jumlah: 224,
    peratus: 96.0,
    ikut_kelas: [
      { kelas: '1 BIJAK', hadir: 28, tidak_hadir: 0, ditanda: 28, belum_ditanda: 0, jumlah: 28, peratus: 100.0 },
      { kelas: '2 BIJAK', hadir: 23, tidak_hadir: 5, ditanda: 28, belum_ditanda: 0, jumlah: 28, peratus: 82.1 },
      { kelas: '3 BIJAK', hadir: 24, tidak_hadir: 4, ditanda: 28, belum_ditanda: 0, jumlah: 28, peratus: 85.7 }
    ]
  };
  const a2 = ctx.analisisHarian(rekodLengkap);
  assert.equal(a2.boleh100, true);
  assert.equal(a2.amaran, null);
  assert.ok(a2.teksKetidakhadiran.includes('2 BIJAK'), 'Mesti menyenaraikan kelas ketidakhadiran tertinggi');
  assert.equal(a2.ketidakhadiranTertinggi[0].kelas, '2 BIJAK');
  assert.equal(a2.ketidakhadiranTertinggi[0].tidak_hadir, 5);
});

test('cfgPecahanKelasHarian menyenaraikan SEMUA kelas termasuk sifar tidak hadir dan belum ditanda', () => {
  const ctx = ciptaKonteks();
  const rekod = {
    tarikh: '2026-10-27',
    hadir: 50,
    tidak_hadir: 2,
    ditanda: 52,
    belum_ditanda: 28,
    jumlah: 80,
    peratus: 96.2,
    ikut_kelas: [
      { kelas: '1 BIJAK', hadir: 28, tidak_hadir: 0, ditanda: 28, belum_ditanda: 0, jumlah: 28, peratus: 100.0 },
      { kelas: '2 BIJAK', hadir: 22, tidak_hadir: 2, ditanda: 24, belum_ditanda: 0, jumlah: 24, peratus: 91.7 },
      { kelas: '3 BIJAK <script>', hadir: 0, tidak_hadir: 0, ditanda: 0, belum_ditanda: 28, jumlah: 28, peratus: null }
    ]
  };
  const cfg = ctx.cfgPecahanKelasHarian(rekod);
  assert.equal(cfg.type, 'table');
  const rows = cfg.tableRows();
  assert.equal(rows.length, 3, 'Semua 3 kelas mesti dipaparkan');
  // Periksa kelas 1 BIJAK (hadir penuh)
  assert.equal(rows[0][0], '1 BIJAK');
  assert.equal(rows[0][1], '28'); // hadir
  assert.equal(rows[0][2], '0');  // tidak hadir
  // Periksa kelas 3 BIJAK (belum ditanda) - peratus mesti '—' bukan sifar
  assert.equal(rows[2][4], '28'); // belum ditanda
  assert.equal(rows[2][6], '—');  // peratus null dipaparkan '—'
});

test('cfgTrendHarian memaparkan SEMUA tarikh dalam bulan terpilih tanpa dipotong tail global', () => {
  const ctx = ciptaKonteks();
  // Set density global ke '3' terkini
  ctx.STATE.density = '3';
  const harian = [
    { tarikh: '2026-10-01', hadir: 220, ditanda: 224, jumlah: 224, peratus: 98.2, belum_ditanda: 0 },
    { tarikh: '2026-10-02', hadir: 219, ditanda: 224, jumlah: 224, peratus: 97.8, belum_ditanda: 0 },
    { tarikh: '2026-10-05', hadir: 222, ditanda: 224, jumlah: 224, peratus: 99.1, belum_ditanda: 0 },
    { tarikh: '2026-10-06', hadir: 221, ditanda: 224, jumlah: 224, peratus: 98.7, belum_ditanda: 0 },
    { tarikh: '2026-10-07', hadir: 220, ditanda: 224, jumlah: 224, peratus: 98.2, belum_ditanda: 0 }
  ];
  const cfg = ctx.cfgTrendHarian(harian, '2026-10');
  // Walaupun density = 3, trend harian bulan mesti ada SEMUA 5 tarikh
  assert.equal(cfg.labels.length, 5, 'Semua 5 tarikh dalam bulan mesti ada');
  assert.equal(cfg.series[0].values.length, 5);
  // Tooltip custom mesti mengandungi tarikh penuh dan kelengkapan
  const tip = cfg.tipCustom(0);
  assert.ok(tip.includes('1 Okt 2026') || tip.includes('2026-10-01'));
  assert.ok(tip.includes('Kelengkapan') || tip.includes('ditanda'));
});

test('bersihkanKad membersihkan pendaftaran REG dan observer', () => {
  const ctx = ciptaKonteks();
  let disconnected = false;
  const mockContainer = {
    contains: (el) => el === dummyCol
  };
  const dummyCol = {};
  const dummyItem = {
    col: dummyCol,
    observer: {
      disconnect: () => { disconnected = true; }
    }
  };
  const kekalItem = {
    col: {},
    observer: {
      disconnect: () => {}
    }
  };
  ctx.REG.length = 0;
  ctx.REG.push(dummyItem);
  ctx.REG.push(kekalItem);
  assert.equal(ctx.REG.length, 2);

  ctx.bersihkanKad(mockContainer);
  assert.equal(ctx.REG.length, 1);
  assert.equal(ctx.REG[0], kekalItem);
  assert.equal(disconnected, true, 'Observer mesti dipanggil disconnect');
});

test('data rangkaian baharu digunakan tanpa bayang global data terbina',()=>{
 assert.doesNotMatch(html,/globalThis\.DATA\s*=|globalThis\.STATE\s*=/);
 const ctx=ciptaKonteks(); ctx.STATE.sesi='2026';
 ctx.DATA={sesi:{'2026':{penanda:'segar'}}};
 assert.equal(ctx.S().penanda,'segar');
 ctx.DATA={sesi:{'2026':{penanda:'lebih baharu'}}};
 assert.equal(ctx.S().penanda,'lebih baharu');
});
test('jadual melolos semua sel walaupun teks mengandungi entiti HTML',()=>{
 const ctx=ciptaKonteks();
 const result=ctx.tableHTML({tableHead:['Ujian'],tableRows:()=>[['&amp;<img src=x onerror=alert(1)>']]});
 assert.doesNotMatch(result,/<img/);
 assert.match(result,/&amp;amp;&lt;img/);
});
test('Loloskan label sumber bagi mengelakkan XSS', () => {
  const ctx = ciptaKonteks();
  const rekod = {
    tarikh: '2026-10-27',
    hadir: 20,
    tidak_hadir: 0,
    ditanda: 20,
    belum_ditanda: 0,
    jumlah: 20,
    peratus: 100,
    ikut_kelas: [
      { kelas: '<img src=x onerror=alert(1)>', hadir: 20, tidak_hadir: 0, ditanda: 20, belum_ditanda: 0, jumlah: 20, peratus: 100 }
    ]
  };
  const cfg = ctx.cfgPecahanKelasHarian(rekod);
  const rendered = ctx.tableHTML(cfg);
  assert.doesNotMatch(rendered, /<img src=x/, 'Tag HTML mesti diloloskan');
  assert.match(rendered, /&lt;img/, 'Aksara < mesti ditukar ke &lt;');
});

test('secKehadiran membina UI lengkap harian: Trend harian, Jadual kelas, dan Kad bulanan kekal', () => {
  const ctx = ciptaKonteks();
  ctx.DATA = {
    sesi_semasa: '2026',
    sesi: {
      '2026': {
        enrolmen: { ikut_tahun: [{ tahun: 'Tahun 1', lelaki: 10, perempuan: 10 }] },
        kehadiran: {
          bulanan: [{ bulan: 'Jan', murid: 95, guru: 98 }],
          ikut_kelas: [{ kelas: '1 Amanah', peratus: 95 }],
          harian: [
            {
              tarikh: '2026-10-27',
              hadir: 220,
              tidak_hadir: 4,
              ditanda: 224,
              belum_ditanda: 0,
              jumlah: 224,
              peratus: 98.2,
              ikut_kelas: [
                { kelas: '1 BIJAK', hadir: 28, tidak_hadir: 0, ditanda: 28, belum_ditanda: 0, jumlah: 28, peratus: 100.0 }
              ]
            }
          ]
        }
      }
    }
  };
  ctx.STATE.sesi = '2026';
  ctx.REG.length = 0;
  const sec = ctx.document.createElement('section');
  ctx.secKehadiran(sec);

  // Semak kad-kad yang didaftarkan
  const titles = ctx.REG.map(c => c.spec.title);
  assert.ok(titles.some(t => t.includes('Trend kehadiran harian')), 'Mesti ada carta Trend kehadiran harian');
  assert.ok(titles.some(t => t.includes('Pecahan kehadiran mengikut kelas')), 'Mesti ada jadual Pecahan kehadiran mengikut kelas');
  assert.ok(titles.some(t => t.includes('Kehadiran bulanan')), 'Mesti kekalkan kad Kehadiran bulanan');
  assert.ok(titles.some(t => t.includes('Kehadiran mengikut kelas')), 'Mesti kekalkan kad Kehadiran mengikut kelas');

  // Jadual pecahan kelas sentiasa boleh diakses (type table)
  const tblCard = ctx.REG.find(c => c.spec.title.includes('Pecahan kehadiran mengikut kelas'));
  assert.equal(tblCard.spec.type, 'table', 'Jadual pecahan kelas mesti type table');
});

test('Pengendalian fallback hari_ini memaparkan tarikh rekod dan tidak mendakwa data lapuk sebagai hari ini', () => {
  const ctx = ciptaKonteks();
  ctx.DATA = {
    sesi_semasa: '2026',
    sesi: {
      '2026': {
        enrolmen: { ikut_tahun: [{ tahun: 'Tahun 1', lelaki: 10, perempuan: 10 }] },
        kehadiran: {
          bulanan: [{ bulan: 'Jan', murid: 95, guru: 98 }],
          ikut_kelas: [{ kelas: '1 Amanah', peratus: 95 }],
          harian: [], // Tiada harian
          hari_ini: {
            tarikh: '2026-08-24', // Tarikh lapuk
            hadir: 200,
            tidak_hadir: 15,
            ditanda: 215,
            peratus: 93.0,
            ikut_kelas: [{ kelas: '1 Amanah', tidak_hadir: 3 }]
          }
        }
      }
    }
  };
  ctx.STATE.sesi = '2026';
  ctx.REG.length = 0;
  const sec = ctx.document.createElement('section');
  ctx.secKehadiran(sec);

  const titles = ctx.REG.map(c => c.spec.title);
  // Tarikh rekod lama dipaparkan secara telus
  assert.ok(titles.some(t => t.includes('24 Ogos 2026')), 'Tajuk carta tidak hadir mesti menunjukkan tarikh rekod');
  assert.ok(titles.some(t => t.includes('Kehadiran bulanan')), 'Kad bulanan tetap wujud');
});

test('CSS mematuhi keperluan mudah alih 390px dan tiada kebergantungan luar', () => {
  assert.match(html, /@media\s*\(max-width:760px\)/, 'Responsif telefon mesti wujud');
  assert.match(html, /\.tblwrap/, 'Balutan jadual responsif mesti wujud');
  assert.doesNotMatch(html, /<script\s+src=["']http/, 'Tiada pustaka/skrip luar dibenarkan');
  assert.doesNotMatch(html, /<link\s+[^>]*href=["']http/i, 'Tiada helaian gaya luar dibenarkan');
});

test('Interaksi dropdown: pertukaran bulan mengemas kini tarikh terkini bulan, pertukaran tarikh mengemas kini bulan', () => {
  const ctx = ciptaKonteks();
  ctx.DATA = {
    sesi_semasa: '2026',
    sesi: {
      '2026': {
        enrolmen: { ikut_tahun: [{ tahun: 'Tahun 1', lelaki: 10, perempuan: 10 }] },
        kehadiran: {
          bulanan: [{ bulan: 'Jan', murid: 95, guru: 98 }],
          ikut_kelas: [{ kelas: '1 Amanah', peratus: 95 }],
          harian: [
            { tarikh: '2026-09-28', hadir: 210, tidak_hadir: 14, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 93.8 },
            { tarikh: '2026-09-30', hadir: 215, tidak_hadir: 9, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 96.0 },
            { tarikh: '2026-10-01', hadir: 218, tidak_hadir: 6, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 97.3 },
            { tarikh: '2026-10-27', hadir: 220, tidak_hadir: 4, ditanda: 224, belum_ditanda: 0, jumlah: 224, peratus: 98.2 }
          ]
        }
      }
    }
  };
  ctx.STATE.sesi = '2026';
  ctx.STATE.tarikhKehadiran = null;
  ctx.STATE.bulanKehadiran = null;
  const sec = ctx.document.createElement('section');
  ctx.secKehadiran(sec);

  // Mula-mula, tarikh adalah 2026-10-27 dan bulan 2026-10
  assert.equal(ctx.STATE.tarikhKehadiran, '2026-10-27');
  assert.equal(ctx.STATE.bulanKehadiran, '2026-10');

  const selB = ctx.document.getElementById('selBulanKehadiran');
  const selT = ctx.document.getElementById('selTarikhKehadiran');
  assert.ok(selB, 'Dropdown selBulanKehadiran wujud');
  assert.ok(selT, 'Dropdown selTarikhKehadiran wujud');

  // Pengguna menukar bulan ke 2026-09
  selB.dispatchEvent({ type: 'change', target: { value: '2026-09' } });
  assert.equal(ctx.STATE.bulanKehadiran, '2026-09');
  assert.equal(ctx.STATE.tarikhKehadiran, '2026-09-30', 'Tukar bulan memilih hari terkini bulan itu');
  assert.equal(selT.value, '2026-09-30');

  // Pengguna menukar tarikh ke 2026-10-01
  selT.dispatchEvent({ type: 'change', target: { value: '2026-10-01' } });
  assert.equal(ctx.STATE.tarikhKehadiran, '2026-10-01');
  assert.equal(ctx.STATE.bulanKehadiran, '2026-10', 'Tukar tarikh mengemas kini bulan analisis terpilih');
  assert.equal(selB.value, '2026-10');
});


