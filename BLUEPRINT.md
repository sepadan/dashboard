# Blueprint Ekosistem Data SK Paya Redan

**Versi 4.4 · 25 Ogos 2026**

Dokumen ini ialah **hab dokumentasi** ekosistem. Ia ditulis supaya sesiapa — manusia atau AI — boleh meneruskan kerja tanpa perlu membaca sejarah perbualan.

---

## Peta dokumentasi — baca ini dahulu

Ekosistem ini mempunyai **empat dokumen blueprint**, dan setiap satu ada peranan berbeza. Ia bukan salinan antara satu sama lain.

| Dokumen | Peranan | Alamat |
|---|---|---|
| **Fail ini** — hab | Peta ekosistem · peraturan merentas sistem · kontrak data · akaun · **daftar isu** | `sepadan/dashboard/BLUEPRINT.md` |
| `BLUEPRINT-AKSI.md` — jejari | Dalaman AKSI sahaja | `sepadan/aksi` |
| `BLUEPRINT.md` — jejari | Dalaman HADIR sahaja | `sepadan/hadir` |
| `docs/SEMAK-Blueprint.md` — jejari | Dalaman SEMAK sahaja | `sepadan/semak` |

### Tiga peraturan yang mengikat keempat-empatnya

**1. Daftar isu hanya wujud di sini.**
Bahagian 8 fail ini ialah **satu-satunya** senarai perkara yang belum selesai dalam seluruh ekosistem. Jejari **tidak boleh** menyimpan senarai isu, senarai "langkah seterusnya", atau senarai status sendiri. Jumpa satu di sana? Pindahkan ke sini, kemudian buang dari sana.

> Sebabnya: empat senarai isu bermakna empat versi kebenaran. Satu berkata isu sudah ditutup, satu lagi berkata masih terbuka, dan sesi seterusnya mempercayai mana-mana yang dibacanya dahulu. Percanggahan itu senyap — tiada apa yang gagal, cuma kerja yang salah dibuat.

**2. Jejari menerangkan *bagaimana*, hab menerangkan *apa dan kenapa*.**
Skema tab, kontrak API, langkah deployment, perangkap yang sudah dicuba — semua itu milik jejari, dekat dengan kodnya. Peraturan yang mengikat lebih daripada satu sistem, kontrak antara sistem, dan keputusan yang menjejaskan ekosistem — milik hab.

Jejari **tidak boleh** membuat kenyataan status tentang sistem lain. "AKSI sudah siap" dalam blueprint HADIR ialah maklumat yang akan menjadi palsu tanpa sesiapa perasan.

**3. Setiap jejari mesti membawa blok kepala yang menunjuk ke sini.**
Supaya sesi yang dibuka terus dalam repo jejari — dan itulah yang biasa berlaku — tahu hab ini wujud.

### Kepada AI yang membaca ini

1. Baca [`CLAUDE.md`](CLAUDE.md) dalam repo yang tuan sedang kerjakan
2. Baca **Peraturan yang tidak boleh dilanggar** (bahagian 3) di bawah — setiap satu ialah pepijat yang pernah berlaku
3. Baca **bahagian 8** dan sambung dari situ, bukan dari andaian sendiri
4. Kalau bekerja pada satu sistem sahaja, baca jejarinya juga
5. Selepas selesai: kemas kini fail ini **dalam commit yang sama**

Kalau dokumen bercanggah dengan kod, **kod yang betul**. Betulkan dokumen.

---

## 1. Gambaran keseluruhan

Tiga sistem mengumpul data, satu memaparkannya. HADIR ialah muka depan kedua bagi KEHADIRAN, bukan simpanan berasingan.

```mermaid
flowchart TD
  G[Guru · bot Telegram] -->|doPost| KH[(KEHADIRAN<br/>Google Sheets)]
  GW[Guru · PWA HADIR] -->|doPost mode=hadir| KH
  GM[Guru · web SEMAK] --> SM[(SEMAK<br/>Google Sheets)]
  GK[Guru · web AKSI] --> AK[(AKSI<br/>Google Sheets)]

  KH --> DGS[Dashboard.gs<br/>dalam projek KEHADIRAN]
  SM -.baca sahaja.-> DGS
  AK -.baca sahaja.-> DGS

  KH -->|senarai murid rasmi| SM
  KH -->|senarai murid rasmi| AK

  DGS -->|setiap 30 minit,<br/>hanya bila berubah| DJ[data.json]
  DJ --> GH[(GitHub<br/>sepadan/dashboard)]
  GH --> PG[GitHub Pages<br/>Dashboard SePadan]
  PG --> TV[Skrin bilik guru<br/>Mod TV]
  PG --> PIBG[Guru · PIBG · orang awam]
```

**Prinsip utama:** setiap sistem memiliki datanya sendiri. Dashboard **tidak pernah menulis** ke mana-mana sistem — ia hanya membaca dan menerbitkan angka agregat.

---

## 2. Komponen

### 2.1 KEHADIRAN — sistem induk

| | |
|---|---|
| Spreadsheet | `16QZX5IYTUeQiYp9co2yXW5VQfgcY0J7_zPrDCygPbLk` |
| Apps Script | `1ZtYVu89oE667IacRva0z1-GuxzzoyjeJyUyXian0_lSOReL14WctfcJi` |
| Pemilik | `sekolah-3458-cm1@moe-dl.edu.my` (delima) |
| Editor | `barukulamamu@gmail.com` |
| Perkongsian | Restricted |
| Repo kod | privat — `sistem-kehadiran-sepadan` |

Sistem ini menjadi **tuan rumah** bagi `Dashboard.gs`. Semua penjanaan `data.json` berlaku di sini.

Mulai 24 Ogos 2026, projek yang sama turut menjadi backend bagi PWA **HADIR**.
Penghala `doPost` membezakan muatan `mode=hadir` sebelum meneruskan logik bot
Telegram; kedua-dua saluran menulis tab `kehadiran` yang sama. Fail
`HadirWeb.gs` sudah disimpan dan deployment aktif dinaikkan ke versi 96 pada
URL yang sama. Repo muka depan ialah `sepadan/hadir`.

**Tab:**

| Tab | Peranan |
|---|---|
| `main` | Senarai murid aktif. **Senarai rasmi sekolah** — semua sistem lain disemak terhadapnya |
| `kehadiran` | Satu baris satu murid, satu lajur satu tarikh. `1` hadir · `0` tidak hadir · `—` bukan murid sekolah pada tarikh itu |
| `rmt` | Status penerima Rancangan Makanan Tambahan |
| `arkib_murid` | Tempoh murid tidak aktif `[mula, tamat)` |
| `jantina` | Peta IC → L/P |
| `tetapan_dashboard` | Tetapan dashboard — lihat 4.1 |
| `dash_*` | Data manual pilihan; kosong bermakna "ambil dari sistem luar" |
| `<KELAS>_<BULAN>` | Tab bulanan dijana automatik |

**Susunan lajur `main` (11 lajur teras):**

```
0 BIL · 1 ID MURID · 2 NAMA · 3 NO. PENGENALAN · 4 JENIS PENGENALAN
5 TARIKH LAHIR · 6 STATUS · 7 TARIKH MASUK · 8 TARIKH MASUK KELAS
9 TAHUN/TINGKATAN · 10 NAMA KELAS
```

Lajur 11 ke atas datang dari MOEIS (JANTINA, KAUM, OKU, YATIM, pendapatan penjaga, dsb.) dan dipetakan mengikut **nama tajuk**, bukan kedudukan.

> ⚠️ **Jangan sort tab `main` secara manual.** Skrip menyusunnya sendiri semasa upload dan menulis semula 11 lajur mengikut susunan itu. Pernah berlaku: nama bergerak tetapi lajur MOEIS kekal, menyebabkan 41% rekod tidak sejajar. Gunakan **🔍 Semak Sejajaran Tab Main** untuk mengesahkan.

### 2.1b HADIR — PWA kehadiran dan penyelarasan murid

| | |
|---|---|
| Repo | `sepadan/hadir` — awam, kod sahaja |
| Laman | `https://sepadan.github.io/hadir/` |
| Backend | Projek Apps Script KEHADIRAN yang sama |
| Versi | `HADIR v1.4.0 · PWA` |

HADIR menggunakan satu muka mesra telefon. Dropdown kelas di bahagian atas
memudahkan guru menapis kelas, kelas pertama dimuat automatik, semua murid
dianggap hadir dan guru hanya menekan nama murid tidak hadir. Guru tidak perlu
log masuk; sesiapa yang mengetahui URL boleh membaca nama dan mengisi
kehadiran. Seluruh kelas ditulis melalui satu `setValues()` di bawah
`ScriptLock`. Ia ialah saluran sandaran/pantas; bot Telegram kekal berfungsi.

Semak Kehadiran membenarkan guru tanpa login memilih tarikh dalam tahun semasa
dan kelas. Atas keputusan pemilik sistem, nama murid tidak hadir bagi tarikh
terdahulu boleh dibaca melalui URL HADIR; nama murid hadir, IC/MyKid dan status
RMT individu tidak dihantar. Bilangan RMT hadir dikira di backend sebagai angka
agregat kelas. Oleh sebab tab `rmt` hanya menyimpan status semasa, kiraan pada
tarikh lalu menggunakan kelayakan RMT semasa, bukan snapshot sejarah.

Log masuk PIN hanya untuk admin dan terletak dalam menu sisi. Admin boleh
mengemas kini murid dalam HADIR. Tab `main` KEHADIRAN kekal sumber
rasmi, kemudian backend memanggil API `importMurid` AKSI dan `apiUploadMurid`
SEMAK. API rasmi dipilih supaya cache serta calon peperiksaan aktif disegarkan.
Markah dan data kokurikulum tidak disentuh. Kemas kini murid dalam AKSI/SEMAK
masih tersedia; penyelarasan HADIR seterusnya boleh menyamakan semula medan
murid dengan `main`.

PWA mencache cangkerang statik sahaja. Nama, IC, kehadiran, sesi dan jawapan API
tidak dicache. Paparan guru menerima nama serta kunci harian legap; IC/MyKid
tidak dihantar. Ikon menggunakan lambang sekolah dan lencana biru `HADIR`
seperti AKSI/SEMAK. Mulai v1.2.0, sidebar desktop kekal terbuka seperti AKSI,
manakala menu telefon boleh dibuka dan ditutup. Nama kelas dipilih serta
bilangan murid dipaparkan dalam menu. Kawasan kandungan mempunyai scroll
sendiri; kad nama panjang tidak lagi melimpah mendatar dan status kekal nampak.
GitHub Pages run #5 berjaya untuk commit `8284fa6`; Apps Script deployment
versi 96 tidak berubah. Produksi desktop 1440×900 dan telefon 390×844 memuat
28 murid, boleh discroll, PWA `sedia` dan tiada ralat konsol. Ujian hanya
membaca data serta menguji UI; tiada kehadiran disimpan atau sync dijalankan.

### 2.2 SEMAK — markah peperiksaan

| | |
|---|---|
| Spreadsheet | `1Manu3uoLZNZpOn2_qQZ_6CAm25Qik1ddWHGyFN9UD1M` |
| Nama fail | *Sistem Markah SKPR (UPSA)* |
| Pemilik | `barukulamamu@gmail.com` · delima ialah editor |
| Antara muka | Apps Script web app |

**Tab yang dibaca dashboard:** `MARKAH` sahaja (dan `TETAPAN!B4` untuk peperiksaan aktif).

```
MARKAH:  0 PEPERIKSAAN · 1 KELAS · 2 NAMA MURID · 3 SUBJEK · 4 MARKAH
         5 TP · 6 GURU · 7 DIKEMASKINI · 8 IC MURID
```

### 2.3 AKSI — kokurikulum

| | |
|---|---|
| Spreadsheet | `1ElBfhTcj1pcxYS6hA2mzTfEeX5udCskODnNdqU7G_dM` |
| Apps Script | `1a-_G8leFyeftmf4jUB5JURZbZGYlmqlyKgRHm7H8sdqbFGXX5GFDwskK` |
| Pemilik | `sekolah-3458-cm1@moe-dl.edu.my` (delima) |

> ⚠️ **Ada DUA projek Apps Script bernama "AKSI".** Yang hidup ialah
> `1a-_G8le…` pada akaun `/u/0`. Satu lagi, `1ABvFqRhcKqagxvanG9jhOJUF4y4e8Zl…`
> pada akaun `/u/1`, tiada pemicu dan nampaknya tidak digunakan.
> **Sentiasa sahkan ID projek sebelum menampal patch** — menampal ke projek yang
> salah menghasilkan kod yang kelihatan betul tetapi tidak pernah dijalankan.
| Repo kod | awam — `sepadan/aksi` (kod sahaja, tiada data) |
| Antara muka web | `sepadan/aksi` → `docs/` di GitHub Pages |

**Antara muka web AKSI sudah dibina dan BERFUNGSI DALAM PRODUKSI.** Log masuk dari `https://sepadan.github.io/aksi/` disahkan berjaya pada 23 Ogos 2026 — bermakna patch Apps Script (`Auth.gs`, `WebBackend.gs`, dan `getIdentitiAwam`/`getSidebarData` dalam `API_DIBENARKAN`) semuanya sudah masuk ke deployment sebenar, dan CORS merentas asal berfungsi seperti dirancang. Sepuluh halaman statik dalam `docs/`, dengan `js/api.js` sebagai *shim*: ia menggantikan `google.script.run` dengan `fetch` POST ke `/exec` menggunakan `Proxy`, `Content-Type: text/plain` (elak preflight CORS) dan `redirect: follow`. Halaman-halaman itu memanggil `google.script.run` seperti biasa tanpa perlu diubah — corak yang kemas.

Mulai 24 Ogos 2026, halaman baca AKSI menggunakan `AKSI.token()` supaya sesi
kosong dihantar sebagai `TETAMU`. Tetamu, guru dan admin melihat senarai yang
sama; dropdown di atas senarai ialah penapis, bukan syarat untuk memuatkan data.
Tetamu tidak melihat kawalan tambah, edit atau padam, dan backend tetap menolak
panggilan tulis. Pencapaian produksi memaparkan 2 rekod, manakala Kehadiran dan
Laporan memuat 17 pilihan kelab. Tab `PERJUMPAAN` memang kosong, selaras dengan
isu 2b, jadi kedua-dua senarai perjumpaan/laporan memaparkan keadaan kosong yang
betul. Penerbitan akhir kod ialah GitHub Pages run #22.

AKSI kini mempunyai PWA v1.2.0 yang lengkap dan sudah diterbitkan: ikon
aplikasi berasaskan lambang sekolah dengan lencana
`AKSI`, Web App Manifest, ikon Android/iOS, Service Worker, halaman luar talian
dan kemas kini automatik setiap kali aplikasi dibuka. Strategi cache ialah
cangkerang statik sahaja; permintaan Apps Script, token dan data sekolah tidak
dipintas atau disimpan. GitHub Pages run #26 berjaya untuk commit `3906178`.
Ujian produksi 390×844 mencapai status PWA `sedia`, semua 11 halaman membawa
manifest + pendaftaran PWA, dan 27 aset cache produksi memberi HTTP 200 tanpa
alamat API. Versi pada sidebar ialah `AKSI v1.2.0 · PWA`; ujian tanpa pelayan
turut mengesahkan rangka cache dan halaman luar talian.

`docs/js/config.js` ialah satu-satunya tempat URL `/exec` ditetapkan.

**Tab yang dibaca dashboard:**

| Tab | Lajur yang digunakan |
|---|---|
| `KEAHLIAN` | `IC`, `ID_KELAB`, `KATEGORI`, `TAHUN_AKADEMIK`, `STATUS` |
| `KELAB` | `ID_KELAB`, `NAMA_KELAB`, `KATEGORI`, `JENIS_KELAB` |
| `PENCAPAIAN` | `IC`, `PERINGKAT`, `TAHUN_AKADEMIK` |
| `PERJUMPAAN` | `ID_PERJUMPAAN`, `ID_KELAB`, `TARIKH`, `BIL_HADIR`, `BIL_AHLI` |
| `LAPORAN_PERJUMPAAN` | `ID_PERJUMPAAN` — untuk mengesan perjumpaan tanpa laporan |
| `MURID_MASTER` | `IC`, `STATUS` — sandaran penyebut sahaja |

Lajur dibaca **mengikut nama tajuk**, bukan kedudukan. AKSI masih dalam pembangunan; menyusun semula lajur tidak akan memecahkan penyambung.

**Data AKSI yang BELUM digunakan** (peluang penambahbaikan): `PERJUMPAAN`, `KEHADIRAN`, `LAPORAN_PERJUMPAAN`, `PENILAIAN_KOKU`, `KOMITMEN_DETAIL`, `EKSTRA_KURIKULUM`, `PAJSK_SUMMARY`.

### 2.3b Repo awam yang lain

| Repo | Kandungan | Nota |
|---|---|---|
| `sepadan/semak` | PWA di akar + `index.html` (iframe) + `src/` (5 fail) | SEMAK v1.0.0; backend Apps Script tidak berubah |
| `sepadan/aksi` | kod Apps Script di akar + `docs/` | Lihat 2.3 |
| `sepadan/hadir` | PWA di akar + backend pemasangan dalam `apps-script/` | HADIR v1.4.0; guru tanpa login boleh isi hari ini dan semak tarikh tahun semasa; kiraan RMT hadir agregat; berkongsi backend KEHADIRAN |

`sepadan/semak/index.html` meng-*iframe* `src/App.html` dan menggunakan corak
*shim* yang sama seperti AKSI. **Log masuk disahkan berfungsi pada 23 Ogos
2026.** Pada 24 Ogos, PWA SEMAK v1.0.0 disiapkan dan diterbitkan melalui
GitHub Pages run #35: ikon berasaskan lambang sekolah, manifest Android/iOS, Service
Worker auto-kemas kini, halaman/panel luar talian dan versi paparan baharu.
Cache mengandungi 15 fail statik sahaja; URL Apps Script, markah, token, sesi
dan data murid tidak dicache. Auto-update tidak memuat semula halaman semasa
secara paksa supaya markah yang sedang ditaip tidak hilang.

### 2.4 DASHBOARD — paparan

| | |
|---|---|
| Repo | `sepadan/dashboard` — **AWAM** |
| Laman | `https://sepadan.github.io/dashboard/` |
| Fail | `index.html` (aplikasi) · `data.json` (data) |

Satu fail HTML, tiada kebergantungan luar, carta SVG ditulis tangan. Berfungsi luar talian jika `data.json` dimuat secara manual.

Enam tab: Ringkasan · Enrolmen · Kehadiran · Akademik · HEM · Kokurikulum.
Ditambah **Mod TV** (slaid automatik satu skrin penuh, 15–16 muka, tukar setiap 18 saat) dan **Laporan ringkas** 2 muka A4 untuk cetakan.

---

## 3. Peraturan yang tidak boleh dilanggar

Setiap satu di sini pernah salah sekali dan sudah dibetulkan. Jangan "kemas kini" tanpa membaca sebabnya.

### 3.1 Privasi — sempadan paling penting

**Repo `sepadan/dashboard` adalah AWAM.** `data.json` hanya boleh mengandungi **angka agregat**.

Tidak boleh, dalam apa keadaan sekalipun:

- nama murid
- nombor kad pengenalan
- markah individu
- butiran penjaga, alamat, pendapatan
- senarai nama murid tidak hadir

Kehadiran hari ini memaparkan **bilangan sahaja** (`14 tidak hadir · 3 Bijak: 5`). Ini keputusan sedar, bukan kekurangan. Senarai nama kanak-kanak yang tiada di rumah pada waktu pagi, dikemas kini setiap 30 minit di internet awam, adalah risiko sebenar. Guru melihat nama dalam Telegram dan spreadsheet.

Ujian `uji-aksi.js` mengandungi semakan khusus bahawa tiada IC (12 digit) dan tiada nama murid muncul dalam output. **Kekalkan ujian itu.**

### 3.2 Kokurikulum hanya Tahun 3–6

```
DASH_KOKU_TAHUN_MIN = 3
DASH_KOKU_TAHUN_MAX = 6
```

Prasekolah, Tahun 1 dan Tahun 2 **tidak layak** menyertai kokurikulum. Memasukkan mereka ke dalam penyebut menjadikan peratus penyertaan rendah secara palsu, dan sekolah kelihatan lemah pada perkara yang bukan salahnya.

- **Penyebut** = murid Tahun 3–6 dalam tab `main`
- **Pengangka** = murid Tahun 3–6 yang menyertai ≥1 kelab
- Ahli di bawah Tahun 3 dilaporkan sebagai `bukan_layak`, tidak dikira

### 3.3 Rumah Sukan bukan bidang kokurikulum

Kokurikulum ada **tiga** bidang: Unit Beruniform, Kelab & Persatuan, Sukan & Permainan.

Rumah Sukan ialah struktur berasingan untuk Hari Sukan. Setiap murid diletakkan ke dalam satu rumah **secara automatik**, bukan atas pilihan sendiri.

> Pepijat asal: penormal melihat perkataan "SUKAN" dalam *Rumah Sukan Merah* dan mengelaskannya sebagai bidang Sukan & Permainan. Hampir setiap murid ada rumah, jadi penyertaan melonjak ke hampir 100% dan carta bidang menjadi karut.

Dalam `bidangAksi_()`, corak `\bRUMAH\b` **mesti** disemak **sebelum** `SUKAN`.

Rumah Sukan dikira atas asasnya sendiri: **semua murid kecuali Prasekolah**.

### 3.4 Sistem luar disemak terhadap tab `main`

Pengangka dan penyebut mesti datang dari populasi yang sama. Murid yang sudah berpindah keluar tetapi masih tertinggal dalam AKSI atau SEMAK **tidak dikira**, dan dilaporkan sebagai `luar_main`.

IC dinormalkan dengan `icRingkas_()` — buang semua aksara bukan alfanumerik — sebelum dibandingkan.

### 3.5 Skala gred SEMAK

| Markah | Gred | Mata |
|---:|:---:|---:|
| 82–100 | A | 1 |
| 66–81 | B | 2 |
| 50–65 | C | 3 |
| 35–49 | D | 4 |
| 20–34 | E | 5 |
| 1–19 | F | 6 |
| `0` atau `TH` | TH | — |

- **GPMP** = jumlah mata ÷ bilangan murid yang **mengambil** subjek itu
- **GPS** = jumlah mata semua subjek ÷ jumlah rekod dikira
- **Rendah = baik**
- **TH tidak dikira langsung** — bukan lulus, bukan gagal, tiada dalam penyebut

Skala ini disahkan terhadap 2,033 pasangan (markah, gred) sebenar dan 9/9 nilai GPMP yang dikira sekolah sendiri.

### 3.6 Kosong bukan sifar

Medan tetapan yang kosong menjadi `null`, dan dashboard memaparkan **`—`**.

> Pepijat asal: `nombor_()` memulangkan `0` untuk sel kosong, jadi *Penyertaan kokurikulum* terpapar **0.0%** di skrin bilik guru sedangkan datanya cuma belum diisi.

Gunakan `nomborAtauNull_()` untuk medan pilihan.

### 3.7 Tapisan tahun pada `PERJUMPAAN` tidak boleh membuang baris yang kabur

Tab `PERJUMPAAN` dalam AKSI **tiada lajur tahun akademik**, jadi tahun dicungkil dari lajur `TARIKH`. Kalau sel itu dipaparkan sebagai `5/3/26`, tiada tahun 4-digit di dalamnya.

Peraturan: baris tanpa tahun 4-digit **dikekalkan**, bukan dibuang. Ia dikira dalam `diag_perjumpaan.tarikh_kabur` dan dilaporkan dalam dialog **🏃 Uji Sambungan AKSI**.

> Sebabnya: pembuangan senyap menghasilkan carta kosong yang kelihatan seperti *tiada perjumpaan diadakan* — satu kenyataan palsu tentang guru. Angka yang longgar sedikit lebih baik daripada tuduhan yang salah.

`kiraKokuAksi_()` sentiasa memulangkan `diag_perjumpaan` untuk tujuan ini. Medan itu **tidak** masuk ke `data.json`; ada ujian yang membuktikannya.

### 3.8 Satu fail, satu pemilik

| Fail | Pemilik | Cara ia sampai ke GitHub |
|---|---|---|
| `index.html` | **git** | Manusia menolaknya dari komputer |
| `data.json` | **Apps Script** | Automatik setiap 30 minit |

Apps Script **tidak boleh** menolak `index.html`. Fungsi `hantarDashboardKeGitHub()`, pembantu `cariIndexHtml_()`, dan baris tetapan `id_html_dashboard` sudah dibuang pada 23 Ogos 2026.

> Sebabnya: fungsi itu menyalin `index.html` dari Google Drive. Salinan Drive itu menjadi sumber kebenaran kedua. Bila salinan lapuk ditolak, ia menindih kerja yang baharu **di luar git** — jadi tiada `git reflog`, tiada commit, tiada apa yang boleh dipulihkan. Kemudahan satu klik itu tidak berbaloi dengan risiko kehilangan senyap.

Ada ujian dalam `uji-pasang.js` yang gagal kalau mana-mana pengenal itu muncul semula.

### 3.9 Manual sentiasa menang

Nilai yang diisi manual dalam `tetapan_dashboard` atau tab `dash_*` **menindih** nilai dari sistem luar. Kosongkan untuk kembali kepada automatik. Ini memberi jalan keluar bila sistem luar tersilap.

### 3.10 Satu sumber rasmi bagi identiti murid

Tab `main` KEHADIRAN ialah sumber rasmi bagi identiti, status dan kelas murid.
HADIR boleh menghantar salinan senarai aktif kepada AKSI dan SEMAK, tetapi tidak
boleh menyalin balik markah, keahlian atau data domain lain. IC/MyKid ialah kunci
stabil; perubahan IC dibuat sebagai arkib rekod lama + murid baharu, bukan edit
di tempat.

Kawalan kemas kini murid dalam AKSI/SEMAK dikekalkan sebagai jalan operasi.
Namun, sync HADIR seterusnya boleh menindih medan murid dengan `main`. Setiap
sync mesti menggunakan API rasmi sasaran, memulangkan status setiap aplikasi dan
merekod bilangan sahaja tanpa nama/IC dalam `HADIR_LOG`.

### 3.11 Tajuk tarikh kehadiran mesti dibandingkan secara angka

Tab `kehadiran` memaparkan tajuk tarikh menggunakan format dua digit seperti
`24/08`, sedangkan format lama atau sumber lain boleh menghasilkan `24/8` atau
`24/08/2026`. `kehadiranHariIni_()` tidak boleh membandingkan teks secara tepat.
Ia mesti membaca bahagian hari, bulan dan tahun sebagai nombor; tahun adalah
pilihan tetapi, jika wujud, mesti sepadan dengan tahun semasa.

> Pepijat asal membina sasaran `24/8` lalu gagal menemui tajuk sebenar `24/08`.
> Semua kelas sudah ditanda, tetapi `hari_ini` menjadi `null` dan Dashboard
> memaparkan “Belum ditanda”.

---

### 3.12 Cara menyemak keadaan sebenar sistem

Tiga sumber ini **berbohong**, dan ketiga-tiganya pernah menyesatkan sesi sebenar pada 24 Ogos 2026:

| Sumber | Masalah |
|---|---|
| `raw.githubusercontent.com` | Memulangkan salinan **seminggu lapuk**. Menunjukkan `BLUEPRINT.md` v1.0 sedangkan yang sebenar v3.2 |
| Paparan HTML `github.com` | Senarai fail lapuk — menunjukkan fail yang sudah lama dibuang |
| Folder peti masuk Google Drive | Cerminan sehala. Boleh berbulan ketinggalan |

Gunakan ini:

| Perlu tahu | Cara |
|---|---|
| Isi fail yang diterbitkan | `https://sepadan.github.io/<repo>/<fail>` |
| Fail apa dalam repo | `git ls-files` dalam klon selepas `git pull` |
| Keadaan data langsung | `https://sepadan.github.io/dashboard/data.json` |

> Kesan sebenar: satu sesi hampir menyalin `BLUEPRINT.md` v2.2 dari peti masuk ke repo yang sudah v3.2. Itu akan memadam sepuluh versi kerja, termasuk seluruh sistem HADIR, dan `git` tidak akan membantah kerana ia kelihatan seperti suntingan biasa.

---

## 4. Kontrak data

### 4.1 `tetapan_dashboard`

| Kunci | Kegunaan |
|---|---|
| `sesi` | Tahun sesi, contoh `2026` |
| `nama_sekolah` `kod_sekolah` `daerah` `singkatan` | Identiti |
| `guru` `staf_sokongan` | Bilangan |
| `gps` `peratus_lulus` `peratus_penyertaan_koku` | **Kosongkan** — diambil dari SEMAK/AKSI |
| `kelas` | Kosong = kira dari `main` |
| `id_semak` | ID spreadsheet SEMAK |
| `id_aksi` | ID spreadsheet AKSI |
| `peperiksaan_dashboard` | Kosong = ikut `TETAPAN!B4` SEMAK |
| `ambang_b40` | Pendapatan isi rumah, lalai 5250 |

### 4.2 Bentuk `data.json`

```
sekolah { nama, kod, daerah, singkatan, dikemaskini }
sesi_semasa
sesi.<tahun>
  enrolmen    { ikut_tahun[], ikut_kaum[], guru, staf_sokongan, kelas }
  kehadiran   { bulanan[], ikut_kelas[], hari_ini }
  akademik    { gps, peratus_lulus, mata_pelajaran[], trend_gps[],
                pbd_tahap[], sumber_semak }
  hem         { kepimpinan[], bantuan[], profil_murid[] }
  kokurikulum { peratus_penyertaan, ikut_bidang[], pencapaian[],
                rumah_sukan[], sumber_aksi }
```

Objek `sumber_semak` dan `sumber_aksi` ialah **metadata diagnostik** — bukan untuk dipaparkan. Ia merekod dari mana angka datang dan berapa rekod ditinggalkan.

Menambah sesi baharu = menambah satu kunci di bawah `sesi`. Tiada perubahan kod diperlukan; penapis Sesi dan perbandingan "berbanding sesi lepas" berfungsi sendiri.

### 4.3 Fungsi awam `Dashboard.gs`

| Fungsi | Peranan |
|---|---|
| `pasangSemua` | Pemasangan satu tekan — tetapan, semakan, jana, hantar, pemicu |
| `janaDataDashboard` | Pulangkan objek `data.json` |
| `hantarDataKeGitHub` | Tolak `data.json`; **langkau bila tiada perubahan** |
| `semakAkaun` | Akaun semasa + capaian SEMAK/AKSI + pemicu dimiliki |
| `senaraiPemicu` · `buangPemicuBertimbun` | Urus had 20 pemicu |
| `ujiSambunganSemak` · `ujiSambunganAksi` | Uji satu penyambung tanpa menghantar |
| `semakLajurMain` · `semakSejajaranMain` | Sahkan integriti tab `main` |

---

## 5. Kitaran automatik

**Status pada 23 Ogos 2026: berjalan.** Commit automatik terakhir yang disahkan — `Kemas kini data dashboard — 2026-08-23 21:47`.


1. Pemicu masa berjalan **setiap 30 minit** (`DASH_MINIT_PEMICU`)
2. `hantarDataKeGitHub` menjana `data.json` baharu
3. Membaca versi sedia ada di GitHub, mengekalkan sesi tahun lain
4. `samaKandungan_()` membanding **tanpa mengambil kira cap masa**
5. Sama → berhenti, tiada commit. Berbeza → tolak

Tanpa langkah 4, setiap 30 minit menghasilkan satu commit kosong — beratus sebulan, dan sejarah repo menjadi tidak berguna.

`index.html` **tidak** ditolak automatik. Ia kod, bukan data; ia berubah beberapa kali setahun dan patut disemak sebelum tersiar.

---

## 6. Akaun dan rahsia

| Akaun | Peranan |
|---|---|
| `sekolah-3458-cm1@moe-dl.edu.my` | Pemilik KEHADIRAN dan AKSI. **Akaun utama** |
| `barukulamamu@gmail.com` | Pemilik SEMAK; editor pada dua yang lain |

**Pemicu terikat kepada akaun yang memasangnya, bukan kepada projek.** Dua akaun boleh memasang pemicu yang sama pada projek yang sama, dan masing-masing hanya nampak pemicunya sendiri. Ini menyebabkan `data.json` ditolak dua kali semalam tanpa sesiapa sedar. Jalankan `semakAkaun` sebagai **setiap** akaun untuk mengesahkan hanya satu memegang pemicu.

**Rahsia** — dalam Script Properties sahaja, tidak pernah dalam kod:

```
TELEGRAM_TOKEN · WEBHOOK_URL · WEBHOOK_SECRET
GITHUB_TOKEN · GITHUB_OWNER · GITHUB_REPO
GITHUB_PATH (lalai data.json) · GITHUB_BRANCH (lalai main)
```

`GITHUB_TOKEN` ialah fine-grained PAT, akses `Contents: Read and write` pada `sepadan/dashboard` sahaja.

> Jika rahsia pernah terdedah dalam kod, mesej, atau tangkapan skrin — **batalkan dan jana semula**. Memadamnya dari kod tidak memadai; sejarah masih menyimpannya. Turutan: jana baharu → masukkan ke Script Properties → barulah padam yang lama.

---

## 7. Ujian

Dalam repo `sistem-kehadiran-sepadan`, dijalankan dengan Node tanpa menyentuh Google:

| Fail | Liputan |
|---|---|
| `uji-semak.js` | Skala gred pada setiap sempadan, TH, pemilihan peperiksaan, tindihan manual |
| `uji-aksi.js` | Bidang, peringkat, status, murid unik, Rumah Sukan, **kebocoran PII** |
| `uji-tahun.js` | Kelayakan Tahun 3–6, asas Rumah Sukan |
| `uji-pemicu.js` | Pembersihan pemicu tidak memusnahkan pemicu sistem lain |
| `uji-dari-main.js` | Kaum, OKU, yatim, B40 dari lajur MOEIS |
| `uji-pasang.js` | `setTetapan_` tidak menindih; tab dinamakan semula, bukan dipadam |
| `uji-dashboard-gs.js` · `uji-penuh.js` · `uji-upload.js` | Hujung ke hujung |

Dashboard diuji dengan Playwright: setiap slaid Mod TV muat satu skrin tanpa skrol, pada 1920×1080, 1366×768, 1280×720, potret, mod gelap, dan data kosong.

**Jalankan semua sebelum menghantar sebarang perubahan.**

---

## 8. Daftar isu — satu-satunya dalam ekosistem

**Ini tempat setiap isu terbuka dicatat, bagi kelima-lima komponen.** Blueprint AKSI, HADIR dan SEMAK tidak menyimpan senarai isu sendiri; kalau satu muncul di sana, pindahkan ke sini dan buang dari sana.

Isu yang sudah selesai dikekalkan dengan coretan dan sebab — supaya sesi akan datang tidak "membaiki" semula perkara yang memang sengaja begitu.

1. ~~Carta bidang kokurikulum tidak bermakna~~ — **selesai 23 Ogos 2026.** Digantikan dengan **Kehadiran perjumpaan mengikut kelab**, dikira dari `PERJUMPAAN.BIL_HADIR` dan `BIL_AHLI`. Carta bidang dikekalkan sebagai jadual dengan nota menerangkan kenapa ketiga-tiga angka sepatutnya sama. Ditambah tile *Perjumpaan diadakan* dan *Laporan belum dihantar* (muncul hanya bila > 0)
2. ~~Lima ahli AKSI tiada dalam tab `main`~~ — **selesai 23 Ogos 2026.** IC dikenal pasti melalui **🏃 Uji Sambungan AKSI** dan disahkan oleh pengguna: kelima-lima murid **memang sudah berpindah keluar**. Data betul, bukan pepijat. Angka dashboard sudah pun mengecualikan mereka. Kemas kini pilihan: buang baris mereka dari tab `KEAHLIAN` AKSI supaya amaran `luar_main` kembali kosong dan tidak menjadi bunyi bising yang diabaikan. **IC hanya dipaparkan dalam dialog — tidak pernah masuk ke `data.json`**, dan ada ujian khusus yang membuktikannya
2b. ~~Carta kehadiran perjumpaan kosong~~ — **bukan pepijat.** Disahkan 23 Ogos 2026: AKSI baru sahaja dibina dan tab `PERJUMPAAN` memang belum ada isi. Dashboard sudah menangani keadaan ini dengan betul — ia berundur kepada carta bidang dan memaparkan nota bahawa carta kehadiran akan menggantikannya secara automatik sebaik sahaja perjumpaan pertama direkod. **Tiada tindakan kod diperlukan; ia akan pulih sendiri apabila guru mula menanda kehadiran**
3. ~~`id_html_dashboard` kosong~~ — **ditutup 23 Ogos 2026 dengan membuang cirinya.** `index.html` memang sepatutnya ditolak melalui git sahaja. Lihat peraturan 3.8
4. **SEMAK masih di Firebase** (`semak-skpr.web.app`) — pengganti sudah hidup dan disahkan: `sepadan.github.io/semak/` menghidangkan aplikasi penuh (`src/App.html`) dengan log masuk berfungsi. Firebase hanya menghidangkan halaman penunjuk ke Apps Script; **tiada kod, data atau markah tersimpan di sana**.

   **Keputusan pengguna (23 Ogos 2026): padam terus tapak Firebase**, tanpa halaman ubah hala. Komputer sekolah tiada Node/npm, jadi Firebase CLI tidak dapat dipasang, dan bilangan guru cukup kecil untuk pautan baharu diumumkan terus. Kesannya: pautan lama memaparkan *Site Not Found*.

   Fail ubah hala kekal disimpan sekiranya keputusan berubah: `semak/tutup-tanpa-cli/doGet-ubah-hala.gs` (tanpa pemasangan) dan `semak/firebase-tutup/` (perlu Firebase CLI).

   ⚠️ **ID projek `semak-skpr` hilang selamanya selepas dipadam** dan tidak boleh diguna semula sesiapa pun.
5. ~~AKSI Fasa 2~~ — **selesai.** Antara muka web ada dalam `docs/` dan log masuk disahkan berfungsi
6. **Tab `dash_kepimpinan` kosong** — HEM masih perlukan input manual
7. **Kata laluan lalai SEMAK dan AKSI** (`admin`/`guru`) belum ditukar
8. ~~Sesi AKSI tidak pernah dibersihkan~~ — **selesai.** Pemicu harian `cuciSesiLama` berjalan setiap 3 pagi, kadar ralat 0%
9. ~~`README.md` repo AKSI lapuk~~ — **selesai 23 Ogos 2026.** Ditulis semula: struktur sebenar, cara *shim* berfungsi, status pengesahan
10. ~~AKSI dan SEMAK belum diuji hujung-ke-hujung~~ — **selesai 23 Ogos 2026.** Log masuk dari GitHub Pages berjaya bagi **kedua-duanya**
11. ~~Pemicu `cuciSesiLama` AKSI belum disahkan~~ — **selesai 23 Ogos 2026.** Pemicu masa wujud dalam projek `1a-_G8le…`, larian terakhir 23 Ogos 3:05 pagi, kadar ralat 0%. Isu #8 turut ditutup dengan ini
12. ~~`PELAN-MIGRASI.md` ketinggalan~~ — **selesai 23 Ogos 2026.** Fasa 1 dan 2 ditanda siap dan disahkan; Fasa 3–5 ditanda *dibina, menunggu pengesahan*; Fasa 6 ditanda belum patut bermula. Ditambah senarai semak pengesahan operasi baca/tulis
13. ~~Projek Apps Script "AKSI" bertindih~~ — **selesai 23 Ogos 2026.** Projek `1ABvFq…` sudah dinamakan semula
14. **Operasi tulis AKSI separa disahkan** — `laporan.html` **disahkan berfungsi 23 Ogos 2026**: laporan tersimpan bersama satu gambar, nama guru dan tarikh betul. Ini membuktikan laluan tulis dan muat naik fail menerusi ApiShim memang berfungsi, iaitu operasi paling berisiko dalam senarai. Masih belum diuji: `keahlian`, `kehadiran`, `pencapaian`, `penilaian`, dan sama ada `PDF_URL` benar-benar terisi. Senarai semak ada dalam `PELAN-MIGRASI.md`; **`kehadiran.html` ialah keutamaan tertinggi** kerana ia yang mengisi tab `PERJUMPAAN`. **Fasa 6 tidak boleh bermula sebelum ini selesai** — deployment lama ialah satu-satunya jaring keselamatan
15. ~~Logout AKSI boleh tergantung~~ — **pembaikan diterbitkan 24 Ogos 2026.** Sesi pelayar kini dipadam serta-merta tanpa menunggu jawapan Apps Script; pembatalan token dihantar dengan `keepalive`, permintaan API mempunyai had masa, dan URL aset diberi versi supaya cache GitHub Pages tidak mengekalkan kod lama. GitHub Pages run #19 berjaya dan ujian automatik lulus. **Masih perlu satu pengesahan manual menggunakan akaun guru sebenar** bahawa sidebar bertukar kepada *Mod lihat sahaja* selepas logout
16. ~~Senarai AKSI tidak dimuat dalam mod tetamu~~ — **selesai 24 Ogos 2026.** Semua halaman menggunakan token `TETAMU` melalui `AKSI.token()`. Kehadiran dan Laporan memaparkan senarai dahulu serta menggunakan dropdown sebagai penapis; Pencapaian memaparkan semua rekod pada permulaan. Produksi tetamu disahkan memuat 17 pilihan kelab dan 2 rekod Pencapaian dengan sifar kawalan tulis. Data perjumpaan/laporan kosong kerana tab `PERJUMPAAN` sememangnya belum berisi, bukan kerana ralat token. Laluan admin/guru berkongsi logik muatan yang sama; pengesahan visual menggunakan akaun sebenar masih disarankan
17. ~~Menu AKSI mudah alih tidak boleh ditutup~~ — **selesai dan diterbitkan 24 Ogos 2026.** Sidebar kini mempunyai butang `×` 44×44 dan boleh ditutup melalui kawasan gelap, `Escape` atau pautan navigasi. GitHub Pages run #24 berjaya; produksi diuji pada viewport 390×844 bagi tiga cara tutup tanpa ralat JavaScript
18. ~~PWA AKSI belum lengkap~~ — **selesai dan diterbitkan 24 Ogos 2026.** Versi `AKSI v1.2.0 · PWA` menambah ikon AKSI berasaskan lambang sekolah, manifest, ikon 192/512 + maskable + Apple, Service Worker auto-kemas kini dan halaman luar talian. GitHub Pages run #26 berjaya; produksi mencapai status `sedia` dan semua 27 aset memberi HTTP 200. API, token dan data sekolah tidak dicache. Baki pengesahan pengguna hanyalah melihat rupa ikon melalui satu pemasangan iPhone sebenar
19. ~~PWA SEMAK belum lengkap~~ — **selesai dan diterbitkan 24 Ogos 2026.** `SEMAK v1.0.0 · PWA` menambah ikon berasaskan lambang sekolah, manifest/ikon Android+iOS, Service Worker, auto-update selamat tanpa muat semula paksa dan paparan luar talian. GitHub Pages run #35 berjaya untuk commit `485bf96`; produksi telefon 390×844 mencapai status `sedia`, dikawal Service Worker dan tiada ralat JavaScript. Semua aset PWA memberi HTTP 200 dan cache tidak mengandungi API/data. Fail `src/`, Apps Script versi 58 dan spreadsheet tidak berubah
21. **Import CSV idME HADIR ditolak** — `Fungsi tidak dibenarkan.` Muka depan HADIR v1.3.0 mempunyai butang *Update Data Murid CSV idME*, tetapi fungsi backendnya sama ada tiada dalam senarai izin projek KEHADIRAN, atau deployment Apps Script belum dibuat semula selepas kod ditampal. **Tiada data terjejas** — penolakan berlaku sebelum sebarang penulisan. Diagnosis: bandingkan nama fungsi yang dipanggil `app.js` dengan senarai izin dalam `HadirWeb.gs`, kemudian sahkan versi deployment
22. ~~Penyelarasan HADIR → AKSI ditolak, → SEMAK memulangkan respons RPC tidak sah~~ — **pembaikan diterbitkan 25 Ogos 2026 pada Apps Script versi 98.** Dua punca sebenar dibaiki dalam penghubung HADIR:
    - **AKSI:** login perkhidmatan sebenarnya berjaya, tetapi sampul RPC import masih membawa token rekaan `SISTEM_HADIR`. Penghala AKSI mengutamakan token sampul itu lalu menganggap sesi tiada. HADIR kini menghantar token sesi sebenar yang baru dipulangkan oleh login pada sampul dan argumen import/logout. Kebenaran admin AKSI kekal dikuatkuasakan; tiada laluan tulis awam ditambah
    - **SEMAK:** `HtmlService` Google membungkus HTML pengguna dan mengekod tanda petik sebagai `\x27`. Respons mengandungi muatan `semak-rpc`, tetapi pencari lama hanya menerima bentuk langsung `atob('...')`. Pembaca baharu menerima kedua-dua bentuk dan mengesahkan `sumber` serta ID permintaan sebelum menggunakan hasil
20. **HADIR v1.4.0 diaktifkan; pengesahan operasi tulis sebenar masih perlu** — repo `sepadan/hadir` mempunyai PWA satu muka, ikon HADIR, guru tanpa login, login admin dalam menu, simpanan kehadiran kelompok, pengurusan murid dan sync API AKSI/SEMAK. Apps Script deployment versi 100 pada URL sama menambah semakan tarikh serta kiraan RMT hadir agregat. Produksi 24 Ogos memuat 9 kelas, 31 tidak hadir dan 26 RMT hadir; penapis kelas serta Bahasa Melayu lulus tanpa ralat. Baki pengguna: simpan satu kelas sebenar dan jalankan satu sync penuh apabila bersedia, kerana ujian tersebut memang akan mengubah data sekolah
21. ~~Kehadiran hari ini kosong walaupun sudah ditanda~~ — **punca dikenal pasti 24 Ogos 2026.** Tajuk tab sebenar ialah `24/08`, tetapi penjana membandingkannya dengan teks `24/8`. `kehadiranHariIni_()` dibaiki supaya menerima `D/M`, `DD/MM` dan tarikh yang turut mempunyai tahun. Mesej kosong Dashboard turut menyebut HADIR dan bot Telegram. Penjana perlu dijalankan semula untuk menggantikan `hari_ini: null` dalam `data.json` awam

---

## 9. Protokol penyelenggaraan

Dokumen ini dikemas kini oleh AI dan manusia. Supaya ia kekal boleh dipercayai:

1. **Setiap perubahan sistem mesti dicerminkan di sini dalam commit yang sama.** Kod berubah tanpa blueprint berubah = blueprint mati
2. **Naikkan nombor versi dan tarikh** di bahagian atas
3. **Tambah entri dalam log perubahan** di bawah
4. **Jangan buang bahagian 3** tanpa menyatakan sebab dalam log. Setiap peraturan di situ ialah pepijat yang pernah berlaku
5. **Bila menambah sistem baharu**, tambah satu sub-bahagian di 2.x, satu kontrak di 4.x, ujiannya di 7, dan satu baris dalam *Peta dokumentasi* di atas
5b. **Isu dicatat di bahagian 8 sahaja.** Kalau jejari mula menumbuhkan senarai isu sendiri, pindahkan kandungannya ke sini dan buang dari sana — itu bukan kerja tambahan, itu menghalang percanggahan senyap
5c. **Jangan percaya `raw.githubusercontent.com` atau peti masuk Drive** untuk mengetahui keadaan sebenar. Lihat peraturan 3.12
6. Kalau maklumat di sini bercanggah dengan kod, **kod yang betul** — betulkan dokumen ini, jangan andaikan kod salah

### Log perubahan

| Versi | Tarikh | Perubahan |
|---|---|---|
| 4.4 | 25 Ogos 2026 | HADIR v1.4.0 diterbitkan melalui commit `8641245` dan Apps Script versi 100. Produksi disahkan membaca 24 Ogos: 9 kelas selesai, 31 tidak hadir, 26 RMT hadir, penapis 1 BIJAK satu kelas dan sifar ralat konsol. Ujian tidak menyimpan kehadiran |
| 4.3 | 25 Ogos 2026 | HADIR v1.4.0 menambah Semak Kehadiran mengikut tarikh bagi tahun semasa untuk guru tanpa login dan bilangan agregat RMT hadir. Respons sejarah mengehadkan nama kepada murid tidak hadir serta tidak menghantar IC, nama murid hadir atau status RMT individu. Versi aset/cache PWA dinaikkan serentak |
| 4.2 | 25 Ogos 2026 | Isu #22 ditutup: token sesi sebenar AKSI kini dihantar pada sampul RPC, pembaca respons SEMAK menerima pembungkus `HtmlService` Google dan menyemak sumber/ID, ujian regresi lulus, commit HADIR `3ce24f9` ditolak dan Apps Script versi 98 diterbitkan pada URL sedia ada. Satu sync sebenar kekal sebagai pengesahan pengguna dalam isu #20 |
| 4.1 | 25 Ogos 2026 | HADIR v1.3.1: pepijat "kosong dibaca sebagai sifar" dibaiki — seluruh kelas tidak lagi bermula sebagai tidak hadir pada pagi hari baru (peraturan 3.6 dilanggar dalam `app.js`). Isu #21 dan #22 dibuka bagi kegagalan import CSV idME dan penyelarasan AKSI/SEMAK |
| 4.0 | 24 Ogos 2026 | **Struktur dokumentasi hab & jejari ditetapkan.** Fail ini menjadi hab: peta ekosistem, peraturan merentas sistem, kontrak, akaun, dan **satu-satunya daftar isu**. Tiga blueprint sistem menjadi jejari — dalaman sahaja, tiada senarai isu, dengan blok kepala menunjuk ke sini. Peraturan 3.12 ditambah selepas tiga kali disesatkan oleh `raw.githubusercontent` dan peti masuk Drive yang lapuk |
| 3.2 | 24 Ogos 2026 | Baiki pengesanan “Kehadiran hari ini”: tajuk `24/08` kini dibandingkan secara angka dan turut menerima `24/8` atau tarikh bertahun. Mesej kosong Dashboard kini menyebut HADIR serta bot Telegram. Data awam kekal bilangan agregat sahaja tanpa nama/IC |
| 3.1 | 24 Ogos 2026 | HADIR v1.2.0 membaiki senarai yang tidak boleh discroll dan limpahan nama panjang, mengekalkan sidebar desktop seperti AKSI, mengekalkan menu buka/tutup pada telefon, serta memaparkan kelas dipilih dalam menu. GitHub Pages run #5 (`8284fa6`) lulus; produksi 1440×900 dan 390×844 disahkan tanpa ralat atau perubahan data |
| 3.0 | 24 Ogos 2026 | HADIR v1.1.0 diterbitkan: satu muka mudah alih dengan dropdown kelas, guru tanpa login, admin dalam menu, nama + kunci harian legap tanpa IC. GitHub Pages run #3 (`ea910fb`) dan Apps Script v96 berjaya; produksi 390×844 memuat data, PWA `sedia`, menu lulus dan tiada ralat. Tiada kehadiran atau sync sebenar dijalankan |
| 2.9 | 24 Ogos 2026 | HADIR v1.0.0 diaktifkan: GitHub Pages run #1 untuk commit `0382449`, Apps Script deployment versi 95 pada URL sama, Script Properties sulit, manifest/Service Worker dan sambungan log masuk produksi disahkan. Ujian menggunakan PIN salah sahaja; data sebenar tidak diubah |
| 2.8 | 24 Ogos 2026 | HADIR v1.0.0 dibina sebagai PWA kehadiran pantas bergaya Telegram dan pusat penyelarasan murid. Ikon HADIR/manifest/Service Worker, simpanan kelompok, pengurusan murid admin, sync API rasmi AKSI/SEMAK dan backend serasi bot Telegram siap. Kod backend sudah disimpan dalam projek KEHADIRAN; deployment/Script Properties/ujian produksi masih menunggu pengaktifan |
| 2.7 | 24 Ogos 2026 | PWA SEMAK v1.0.0 disiapkan dan diterbitkan melalui GitHub Pages run #35 untuk commit `485bf96`: ikon aplikasi berasaskan logo sekolah, manifest/ikon Android+iOS, Service Worker auto-kemas kini tanpa mengganggu markah ditaip, dan paparan luar talian. Produksi telefon 390×844 mencapai `sedia` tanpa ralat; semua aset PWA HTTP 200; API/markah/data tidak dicache |
| 2.6 | 24 Ogos 2026 | PWA AKSI v1.2.0 disiapkan dan diterbitkan melalui GitHub Pages run #26: ikon berasaskan logo sekolah, manifest/ikon Android+iOS, Service Worker auto-kemas kini, halaman luar talian dan versi sidebar baharu. Produksi 390×844 mencapai `sedia`; 11 halaman dan 27 aset sah; cache tidak mengandungi API/data; ujian luar talian lulus |
| 2.5 | 24 Ogos 2026 | Menu mudah alih AKSI mendapat butang tutup, latar boleh tekan, sokongan `Escape` dan keadaan ARIA; GitHub Pages run #24 berjaya dan produksi 390×844 lulus tanpa ralat. Penilaian PWA: sesuai sebagai aplikasi boleh pasang, tetapi cache mesti dihadkan kepada aset statik dan tidak menyimpan data murid/API |
| 2.4 | 24 Ogos 2026 | Isu senarai AKSI tetamu ditutup: token halaman diseragamkan kepada `AKSI.token()`, Kehadiran/Laporan memaparkan senarai sebelum ditapis, Pencapaian memuat semua rekod, dan kawalan tulis kekal tersembunyi. GitHub Pages run #22 berjaya; produksi memaparkan 17 pilihan kelab dan 2 rekod Pencapaian tanpa ralat |
| 2.3 | 24 Ogos 2026 | Isu logout AKSI yang tergantung dibaiki: sesi tempatan tamat serta-merta, pembatalan token menggunakan `keepalive`, API/loading mempunyai had masa, dan URL aset diberi versi untuk memintas cache. GitHub Pages run #19 berjaya; ujian automatik lulus; pengesahan akaun guru sebenar masih perlu |
| 2.2 | 23 Ogos 2026 | Keputusan: tapak Firebase dipadam terus tanpa halaman ubah hala; pautan baharu diumumkan kepada guru. Fail ubah hala dikekalkan sebagai simpanan |
| 2.1 | 23 Ogos 2026 | Firebase CLI tidak boleh dipasang (tiada Node di komputer sekolah). Ubah hala SEMAK dialihkan ke `doGet()` Apps Script — tiada pemasangan diperlukan, dan ia turut menangkap pautan `/exec` terus |
| 2.0 | 23 Ogos 2026 | Isu #3 ditutup dengan **membuang** laluan Drive→GitHub untuk `index.html` — peraturan 3.8 *satu fail, satu pemilik* ditambah, dengan ujian yang menghalangnya dipulihkan. Isu #4 disiasat: pengganti GitHub Pages disahkan hidup, halaman ubah hala Firebase disediakan |
| 1.9 | 23 Ogos 2026 | Isu #2 dan #2b ditutup selepas pengesahan pengguna: lima murid memang berpindah keluar, dan tab `PERJUMPAAN` kosong kerana AKSI baru dibina — kedua-duanya data betul, bukan pepijat. Carta bidang (keadaan berundur) kini membawa nota menerangkan bila carta kehadiran akan menggantikannya |
| 1.8 | 23 Ogos 2026 | `laporan.html` AKSI disahkan menulis ke spreadsheet bersama muat naik gambar — isu #14 separa ditutup, laluan tulis ApiShim terbukti. Dialog AKSI kini mencetak inventori tab (wujud / bilangan baris / dinamakan semula) |
| 1.7 | 23 Ogos 2026 | IC lima ahli `luar_main` dikenal pasti dan dinyahkod — satu murid setiap Tahun 1, 3, 4, 5, 6. Tapisan tahun `PERJUMPAAN` tidak lagi membuang tarikh 2-digit secara senyap (peraturan 3.7). Dialog AKSI kini menerangkan kenapa statistik perjumpaan kosong |
| 1.6 | 23 Ogos 2026 | Tab Kokurikulum ditulis semula — kehadiran perjumpaan menggantikan carta bidang yang rata. SEMAK disahkan berfungsi. Isu #1, #5, #10, #13 ditutup |
| 1.5 | 23 Ogos 2026 | Isu #8 dan #11 ditutup — pemicu `cuciSesiLama` disahkan berjalan. Amaran dua projek Apps Script bernama "AKSI" ditambah ke 2.3; dibuka sebagai isu #13 |
| 1.4 | 23 Ogos 2026 | Tulis semula `README.md` dan `PELAN-MIGRASI.md` repo AKSI supaya sepadan dengan kenyataan. Isu #9 dan #12 ditutup; #13 dibuka |
| 1.3 | 23 Ogos 2026 | AKSI disahkan berfungsi dalam produksi — log masuk berjaya dari GitHub Pages. Isu #10 ditutup; #11 dan #12 dibuka |
| 1.2 | 23 Ogos 2026 | Audit tiga repo awam. Rekod antara muka web AKSI (`docs/`, ApiShim) sebagai siap dan berfungsi. Tambah 2.3b untuk repo `semak`. Pembersihan fail lapuk di GitHub dan folder tempatan |
| 1.1 | 23 Ogos 2026 | Tambah `CLAUDE.md` sebagai protokol kerja. Tile Rumah Sukan setiap rumah dalam tab Kokurikulum. Pembina slaid Mod TV mengambil semua anak seksyen (dahulu hanya `.tiles` dan `.grid` pertama, menyebabkan barisan tile kedua hilang dari Mod TV). Sahkan pemicu 30 minit berjalan di produksi |
| 1.0 | 22 Ogos 2026 | Dokumen asal. Merangkumi KEHADIRAN, SEMAK, AKSI, Dashboard |

---

*Ditulis untuk SK Paya Redan (JBA5054), Pagoh, Johor.*
