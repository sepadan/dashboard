# Panduan Data — Dashboard SePadan
**SK Paya Redan (JBA5054), Pagoh, Johor**

Dashboard ialah **satu fail HTML sahaja** (`dashboard-sepadan.html`). Tiada pemasangan, tiada internet diperlukan, tiada pangkalan data. Ia membaca satu objek data berstruktur JSON.

---

## 1. Tiga cara menyuap data

| Cara | Bila digunakan | Langkah |
|---|---|---|
| **A. Fail `data.json` bersebelahan** | Bila dashboard dihoskan (Google Sites, GitHub Pages, pelayan sekolah, folder rangkaian) | Letak `data.json` dalam folder yang sama dengan fail HTML. Dashboard memuatnya secara automatik. |
| **B. Butang "Muat data JSON"** | Bila dashboard dibuka terus dari fail (offline, USB, e-mel) | Klik butang, pilih fail `.json`. Berfungsi 100% offline. |
| **C. Parameter URL** | Bila data dijana oleh sistem lain di alamat berlainan | `dashboard-sepadan.html?data=https://sistem-sekolah/api/dashboard.json` |

> Jika tiada data luaran dijumpai, dashboard akan guna **data contoh terbina dalam**. Ganti data contoh itu bila sistem tuan sudah sedia.

Untuk cara A dan C, pelayan perlu membenarkan CORS jika domain berbeza.

---

## 2. Struktur data

```
{
  "sekolah":      { … maklumat sekolah … },
  "sesi_semasa":  "2026",
  "sesi": {
     "2026": { enrolmen, kehadiran, akademik, hem, kokurikulum },
     "2025": { … }
  }
}
```

Setiap kunci di bawah `sesi` menjadi satu pilihan dalam penapis **Sesi**. Tambah sesi baharu = tambah satu kunci; tiada perubahan kod diperlukan. Perbandingan "berbanding sesi lepas" pada tile dikira automatik daripada sesi sebelumnya mengikut susunan.

### 2.1 `sekolah`

| Medan | Jenis | Nota |
|---|---|---|
| `nama` | teks | Dipaparkan sebagai tajuk |
| `kod` | teks | Kod sekolah (pilihan) |
| `daerah` | teks | Pilihan |
| `singkatan` | teks | Huruf ganti jika logo gagal dimuat |
| `logo` | teks | **Pilihan.** URL atau data-URL logo. Jika kosong, logo rasmi SK Paya Redan yang sudah tertanam dalam fail akan digunakan |
| `dikemaskini` | `YYYY-MM-DD` | Dipaparkan sebagai "Data dikemaskini" |

### 2.2 `enrolmen`

```json
"enrolmen": {
  "ikut_tahun": [ {"tahun":"Tahun 1","lelaki":34,"perempuan":31} ],
  "ikut_kaum":  [ {"kaum":"Melayu","bilangan":402} ],
  "guru": 31,
  "staf_sokongan": 7,
  "kelas": 12
}
```

Jumlah murid **tidak** dimasukkan secara manual — ia dikira daripada `ikut_tahun`.

### 2.3 `kehadiran`

```json
"kehadiran": {
  "bulanan":    [ {"bulan":"Jan","murid":95.4,"guru":98.1} ],
  "ikut_kelas": [ {"kelas":"1 Amanah","peratus":95.8} ]
}
```

`murid`, `guru`, `peratus` = peratusan (0–100), boleh perpuluhan.

### 2.4 `akademik`

```json
"akademik": {
  "gps": 2.31,
  "peratus_lulus": 89.6,
  "peperiksaan": "PENTAKSIRAN SUMATIF 3",
  "mata_pelajaran": [
    {"mp":"Bahasa Melayu","gpmp":2.05,"peratus_a":26.4,"peratus_lulus":94.2}
  ],
  "trend_gps": [ {"penilaian":"UPSA","penilaian_penuh":"UJIAN PERTENGAHAN SESI AKADEMIK","gps":2.68} ],
  "peperiksaan_semua": [ {"peperiksaan":"UJIAN PERTENGAHAN SESI AKADEMIK","penilaian":"UPSA","gps":2.46,"peratus_lulus":96.9,"mata_pelajaran":[],"pbd_tahap":[],"ikut_kelas":[]} ],
  "pbd_tahap": [ {"tahap":"TP1","bilangan":18} ],
  "ikut_kelas": [ {"kelas":"4 BIJAK","gps":2.27,"peratus_lulus":90.5,"murid":32} ]
}
```

`gps` dan `gpmp` mengikut konvensyen biasa — **nilai lebih rendah = lebih baik**. Dashboard sudah mengambil kira ini pada penunjuk naik/turun.

| Medan | Kegunaan |
|---|---|
| `peperiksaan` | Nama peperiksaan sumber. Dipaparkan sebagai nota di atas tab Akademik. Pilihan |
| `trend_gps[].penilaian_penuh` | Nama penuh penilaian (nama pendek digunakan pada paksi carta). Pilihan |
| `ikut_kelas` | Kad **GPS mengikut kelas**. `murid` = bilangan murid dalam kelas itu. Pilihan |
| `peperiksaan_semua` | Senarai blok akademik penuh bagi **setiap** peperiksaan yang ada markah — `{peperiksaan, penilaian, gps, peratus_lulus, mata_pelajaran, pbd_tahap, ikut_kelas}`. Menghidupkan pemilih **Peperiksaan** dalam tab Akademik. Pilihan |

**Blok ini dijana automatik daripada SEMAK** (Sistem Markah SK Paya Redan) — lihat `SAMBUNG-SEMAK.md`. Tab `dash_matapelajaran`, `dash_trend_gps` dan `dash_pbd` hanya digunakan sebagai sandaran apabila SEMAK tidak dapat dibaca.

### 2.5 `hem` (Hal Ehwal Murid)

```json
"hem": {
  "kepimpinan":   [ {"jawatan":"Pengawas Sekolah","murid":42} ],
  "bantuan":      [ {"jenis":"Rancangan Makanan Tambahan (RMT)","murid":128} ],
  "profil_murid": [ {"perkara":"Keluarga B40","bilangan":268} ]
}
```

| Medan | Kegunaan |
|---|---|
| `kepimpinan` | Badan kepimpinan murid — pengawas sekolah, pengawas perpustakaan, SLB, PRS, ketua & penolong ketua kelas, ketua rumah sukan, dan mana-mana jawatan lain. Tambah baris = tambah bar, tiada had bilangan |
| `bantuan` | Bantuan & kebajikan — BAP, RMT, KWAPM, susu sekolah, biasiswa |
| `profil_murid` | Maklumat latar belakang murid — dipaparkan sebagai jadual dengan peratus enrolmen dan perbandingan sesi sebelum |

Tile "Penerima RMT" dan "Penerima KWAPM" mencari perkataan **RMT/Makanan** dan **KWAPM** dalam medan `jenis`, jadi kekalkan istilah tersebut dalam nama bantuan.

Tile "Pemimpin murid" ialah jumlah semua `kepimpinan`. Jika seorang murid memegang dua jawatan, dia dikira dua kali — masukkan hanya jawatan utama jika tuan mahu bilangan unik.

Nama lama `sahsiah` masih diterima untuk keserasian, tetapi `hem` adalah yang disyorkan. Data kes disiplin **tidak lagi dipaparkan** — medan `kes_bulanan` / `ikut_jenis` akan diabaikan jika masih ada dalam fail.

### 2.6 `kokurikulum`

```json
"kokurikulum": {
  "peratus_penyertaan": 93.7,
  "ikut_bidang": [ {"bidang":"Sukan & Permainan","murid":429} ],
  "pencapaian":  [ {"peringkat":"Daerah","bilangan":14} ]
}
```

Tile "Pencapaian luar sekolah" mengira semua peringkat **kecuali** yang mengandungi perkataan "Sekolah".

---

## 3. Peraturan penting

1. **Susunan tatasusunan menentukan susunan paparan** untuk carta berasaskan masa (`bulanan`, `trend_gps`). Susun dari lama ke baharu.
2. **Carta perbandingan disusun automatik** (GPMP, kehadiran kelas, kaum, kepimpinan, bantuan) — tuan tidak perlu susun.
3. Nombor mestilah **jenis nombor**, bukan teks. `95.4` betul; `"95.4"` salah.
4. Seksyen yang tiada data boleh ditinggalkan — kad berkenaan akan kosong tanpa ralat.
5. Nama medan **mesti sama persis** (huruf kecil, guna `_`).

---

## 4. Menjana `data.json` daripada sistem sedia ada

Bentuk paling ringkas ialah satu skrip yang berjalan berjadual (harian/mingguan) dan menulis semula `data.json`.

**Google Sheets → data.json (Apps Script)**

```javascript
function janaDataJson() {
  const ss = SpreadsheetApp.getActive();
  const baca = (nama) => {
    const d = ss.getSheetByName(nama).getDataRange().getValues();
    const kepala = d.shift();
    return d.filter(r => r[0] !== '')
            .map(r => Object.fromEntries(kepala.map((k,i) => [k, r[i]])));
  };

  const data = {
    sekolah: { nama: "SK Paya Redan", singkatan: "SP",
               dikemaskini: Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd") },
    sesi_semasa: "2026",
    sesi: {
      "2026": {
        enrolmen:   { ikut_tahun: baca('Enrolmen'), ikut_kaum: baca('Kaum'),
                      guru: 31, staf_sokongan: 7, kelas: 12 },
        kehadiran:  { bulanan: baca('KehadiranBulanan'), ikut_kelas: baca('KehadiranKelas') },
        akademik:   { gps: 2.31, peratus_lulus: 89.6,
                      mata_pelajaran: baca('MataPelajaran'),
                      trend_gps: baca('TrendGPS'), pbd_tahap: baca('PBD') },
        hem:        { kepimpinan: baca('Kepimpinan'), bantuan: baca('Bantuan'),
                      profil_murid: baca('ProfilMurid') },
        kokurikulum:{ peratus_penyertaan: 93.7, ikut_bidang: baca('Bidang'),
                      pencapaian: baca('Pencapaian') }
      }
    }
  };

  DriveApp.getFilesByName('data.json').next()
          .setContent(JSON.stringify(data, null, 2));
}
```

Nama lajur dalam setiap helaian mesti sama dengan nama medan di Bahagian 2 (contoh helaian `Enrolmen` berlajur `tahun`, `lelaki`, `perempuan`).

**Dari pangkalan data (PHP/MySQL)** — hasilkan array bersarang yang sama, kemudian `file_put_contents('data.json', json_encode($data, JSON_PRETTY_PRINT))`.

**Semakan cepat sebelum guna:** buka dashboard, klik **Muat data JSON**, pilih fail. Jika struktur salah, mesej ralat akan dipaparkan.

---

## 5. Ciri dashboard

- **6 tab**: Ringkasan, Enrolmen, Kehadiran, Akademik, HEM, Kokurikulum
- **Logo rasmi sekolah** tertanam dalam fail (tiada pautan luar), termasuk sebagai ikon tab pelayar
- **Warna sekolah** hijau–kuning pada antara muka; warna carta kekal pada palet yang disahkan buta-warna
- **Penapis** sesi dan julat paparan carta (semua / 6 terkini / 3 terkini)
- **Laporan ringkas** — 2 muka surat sedia cetak (kepala surat + angka utama + 2 carta + jadual lampiran)
- **Mod TV** — skrin penuh untuk TV bilik guru; tab bertukar sendiri setiap 20 saat dengan bar kemajuan. Tekan `Esc` untuk keluar
- **Butang Jadual** pada setiap carta — angka penuh dalam bentuk jadual
- **Mod gelap**, **Cetak semua** (semua tab sekali gus) dan cetakan bersaiz A4
- **Responsif** — susun atur berubah untuk telefon, tablet dan desktop
- Palet warna disahkan selamat untuk **buta warna** (deutan/protan/tritan) pada mod cerah dan gelap

---

## 6. Menyebarkan kepada guru

| Kaedah | Nota |
|---|---|
| Google Drive → Kongsi pautan | Perlu dimuat turun dahulu untuk dipapar |
| Google Sites (sisip HTML) | Paparan terus dalam laman sekolah |
| GitHub Pages / hosting sekolah | Terbaik untuk `data.json` automatik |
| Hantar fail melalui WhatsApp/e-mel | Berfungsi offline; guna butang "Muat data JSON" untuk data terkini |
