# Pelan migrasi AKSI → GitHub Pages

Matlamat: spreadsheet = pusat data, Apps Script = API JSON, antara muka di
GitHub Pages (`https://sepadan.github.io/aksi/`).

---

## Berita baik: separuh kerja sudah siap

Semasa membaca kod, saya jumpa dua perkara yang mengubah anggaran kerja secara
drastik.

**1. `doPost` sudah menjadi API JSON generik.**
`Code.gs` sudah ada endpoint RPC lengkap dengan senarai putih 75 fungsi
(`API_DIBENARKAN`). Ia menerima `{"fn":"namaFungsi","args":[...]}` dan
memulangkan `{"ok":true,"hasil":...}`. Tiada API baharu perlu direka.

**2. `ApiShim.html` sudah menggantikan `google.script.run` dengan `fetch`.**
Shim itu sudah pun membuat panggilan **rentas-asal** hari ini — dari
`script.googleusercontent.com` (tempat HtmlService melayan halaman) ke
`script.google.com/macros/.../exec`. Ia guna `Content-Type: text/plain` supaya
tiada preflight CORS, dan `redirect: 'follow'`. Corak yang sama akan berfungsi
dari `sepadan.github.io` — asal yang berbeza, mekanisme yang sama.

Kesannya: migrasi ini bukan tulis semula. Ia **memindahkan fail HTML keluar
dari HtmlService** dan menggantikan enam corak templat.

---

## Enam gantian yang diperlukan

Hanya lima jenis skriptlet Apps Script wujud dalam 13 fail HTML:

| Sekarang | Selepas |
|---|---|
| `<?!= include('Style') ?>` | `<link rel="stylesheet" href="css/style.css">` |
| `<?!= include('Script') ?>` `<?!= include('ApiShim') ?>` | `<script src="js/api.js">` `<script src="js/app.js">` |
| `<?!= renderSidebar(token, peranan) ?>` | `renderSidebar()` di klien + fungsi API baharu `getSidebarData()` |
| `<?= token ?>` `<?= peranan ?>` | `sessionStorage.getItem('token' / 'peranan')` |
| `<?= url ?>` | pemalar `URL_EXEC` dalam `js/config.js` |
| `<?= namaSekolah ?>` `<?= tahunAkademik ?>` | dari `getSidebarData()` |

Satu fungsi backend baharu sahaja diperlukan:

```javascript
function getSidebarData(token) {
  if (!semakSesi(token)) return null;
  var t = getTetapan() || {};
  return {
    namaSekolah: t.NAMA_SEKOLAH || '',
    tahunAkademik: t.TAHUN_AKADEMIK || '',
    logo: t.LOGO || '',
    versi: VERSI_SISTEM
  };
}
```
…dan `'getSidebarData'` ditambah ke `API_DIBENARKAN`.

---

## Struktur repo sasaran

```
src/                    kod Apps Script (sumber rasmi)
  Code.gs  Auth.gs  ...  appsscript.json
web/                    diterbitkan oleh GitHub Pages
  index.html            = Login
  dashboard.html  keahlian.html  kehadiran.html
  laporan.html  pencapaian.html  penilaian.html
  senarai.html  admin.html  setup.html
  css/style.css         dari Style.html
  js/config.js          URL_EXEC
  js/api.js             dari ApiShim.html
  js/app.js             dari Script.html + renderSidebar klien
```

---

## Perubahan navigasi — dan satu pembaikan keselamatan percuma

Sekarang setiap pautan sidebar ialah
`.../exec?page=Keahlian&token=<uuid>`. **Token berjalan dalam URL** — ia masuk
ke sejarah pelayar, bar alamat, dan header `Referer`.

Selepas migrasi, pautan menjadi `keahlian.html` sahaja dan token kekal dalam
`sessionStorage`. Kebocoran itu hilang dengan sendirinya.

---

## Fasa

**Fasa 1 — sumber di GitHub** ✅ siap
27 fail dalam `src/`.

**Fasa 2 — rangka web/**
`css/style.css`, `js/config.js`, `js/api.js`, `js/app.js`, dan `index.html`
(Login). Uji log masuk dari `sepadan.github.io` — ini ujian CORS sebenar.
Kalau log masuk berjaya, selebihnya mekanikal.

**Fasa 3 — halaman baca dahulu**
`dashboard.html`, lalu `senarai.html`. Risiko rendah, tiada tulis data.

**Fasa 4 — halaman tulis**
`keahlian`, `kehadiran`, `laporan`, `pencapaian`, `penilaian`.

**Fasa 5 — admin & setup**
`admin.html` (52 KB, paling besar), `setup.html`.

**Fasa 6 — kecilkan Apps Script**
Buang semua `HtmlService` dari `Code.gs`; `doGet` tinggal untuk semakan
kesihatan. Padam 13 fail `.html` dari projek Apps Script.
**Jangan buat fasa ini sebelum Fasa 5 disahkan berfungsi** — deployment lama
adalah jaring keselamatan.

---

## Perkara yang perlu diputuskan / dibaiki

**1. Log masuk (belum diputuskan).**
Sekarang: dua akaun kongsi — `admin` dan `guru` — dalam tab `PENGGUNA`,
password sebagai SHA-256 **tanpa salt**, minimum 4 aksara, dan `login` boleh
dipanggil tanpa kebenaran oleh sesiapa yang tahu URL `/exec` (web app ditetapkan
`ANYONE_ANONYMOUS`). Tiada had cubaan.

Tiga pilihan:
- *Kekal token*, tambah had kadar + password lebih panjang. Paling sedikit kerja.
- *Google Sign-In* — guru log masuk dengan akaun MOE, `doPost` sahkan e-mel
  terhadap tab `GURU`. Tiada password langsung untuk diurus. Paling selamat.
- *Kekal token tapi seorang satu akaun* — supaya `LOG_AKTIVITI` bermakna;
  sekarang semua guru berkongsi identiti `guru`.

**2. Sesi tidak pernah dibuang.**
`buatToken` menulis Script Property `SESI_<uuid>` untuk setiap log masuk.
`semakSesi` hanya memadam sesi yang **dibaca semula selepas tamat tempoh 8 jam**
— sesi yang tidak pernah disentuh lagi kekal selama-lamanya. Sudah ada ratusan.
Script Properties ada had 500 KB; bila penuh, log masuk akan mula gagal.
Baiki dengan fungsi cuci berkala (pemicu harian) yang membuang `SESI_*` lebih
tua daripada 8 jam.

**3. `doPost` memanggil `this[req.fn]`.**
Berfungsi hari ini pada V8, tetapi rapuh. Lebih selamat: peta eksplisit
`var API = { login: login, logout: logout, ... }`.

**4. Gambar laporan.**
`Laporanbackend.gs` menyimpan gambar ke folder Drive (`DRIVE_FOLDER`) dan
menjana PDF. Muat naik dari GitHub Pages kekal melalui `doPost` — saiz muatan
Apps Script terhad ~50 MB tetapi masa jalan 6 minit; gambar besar perlu
dikecilkan di klien dahulu.

**5. `setXFrameOptionsMode(ALLOWALL)`** boleh dibuang selepas Fasa 6 — ia hanya
diperlukan kerana HtmlService melayan dalam iframe.
