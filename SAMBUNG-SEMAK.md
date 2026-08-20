# Menyambung SEMAK ke Dashboard SePadan

Blok **akademik** dalam `data.json` (GPS, peratus lulus, GPMP setiap mata
pelajaran, trend penilaian, taburan tahap penguasaan, dan GPS mengikut kelas)
kini dijana automatik daripada spreadsheet **SEMAK v1** — Sistem Markah SK Paya
Redan. Tiada lagi taip semula angka ke dalam tab `dash_*`.

| | |
|---|---|
| Sumber | Spreadsheet SEMAK (`MARKAH`, `MURID`, `SUBJEK`, `PEPERIKSAAN`, `TETAPAN`, `CALON_PEPERIKSAAN`) |
| Penyambung | Fail `Semak.gs` dalam projek Apps Script *Sistem Kehadiran Sepadan* |
| Arah | **Baca sahaja.** Tiada apa-apa ditulis ke dalam SEMAK |
| Bila | Setiap kali `janaDataDashboard()` dijalankan — termasuk pemicu harian ~10 malam |

---

## 1. Pemasangan (sekali sahaja)

1. Buka spreadsheet **Sistem Kehadiran** → Extensions → **Apps Script**.
2. Tekan **+** di sebelah *Files* → **Script** → namakan **`Semak`** →
   padam kandungan lalai → tampal keseluruhan fail `Semak.gs`.
3. Ganti fail `Dashboard.gs` dan `Kod.gs` dengan versi terbaharu
   (perubahan: `kiraAkademik_` kini memanggil SEMAK, dan menu mendapat
   satu item baharu).
4. **Save** (💾).
5. Kembali ke spreadsheet → muat semula halaman supaya menu dikemas kini.
6. Menu **⚙️ SISTEM SEPADAN → 🧩 Sediakan Tab Dashboard** — ini menambah tiga
   baris tetapan baharu (lihat bawah) tanpa menyentuh data sedia ada.
7. Menu **⚙️ SISTEM SEPADAN → 🔗 Uji Sambungan SEMAK**.
   Kotak dialog sepatutnya memaparkan nama fail SEMAK, nama peperiksaan,
   GPS sekolah, peratus lulus dan senarai mata pelajaran.

> **Kebenaran:** kali pertama, Apps Script akan minta kebenaran membuka
> spreadsheet lain. Terima dengan akaun yang sama yang memiliki SEMAK.

---

## 2. Tetapan dalam tab `tetapan_dashboard`

| Perkara | Nilai lalai | Maksud |
|---|---|---|
| `semak_id` | *(kosong)* | ID **atau pautan penuh** spreadsheet SEMAK. Kosong = guna ID lalai dalam `Semak.gs` (`1Manu3uo…UD1M`) |
| `semak_guna` | `YA` | `TIDAK` mematikan sambungan dan kembali kepada tab `dash_*` manual |
| `semak_peperiksaan` | *(kosong)* | Kosong = ikut **PEPERIKSAAN AKTIF** dalam TETAPAN SEMAK. Isi nama peperiksaan untuk mengunci dashboard pada satu peperiksaan |

---

## 3. Bagaimana angka dikira

Formula disalin **tepat** daripada SEMAK (`Code.gs → kiraGred/kiraTP`,
`AppBackend.gs → apiAnalisis`) supaya angka dashboard sentiasa sepadan dengan
angka yang dilihat guru dalam SEMAK.

| Angka dashboard | Cara dikira |
|---|---|
| `gps` | Purata gred (A=1 … F=6) bagi **semua rekod markah** peperiksaan terpilih, Tahun 1–6 |
| `peratus_lulus` | Rekod bergred A–E ÷ jumlah rekod bergred × 100 |
| `mata_pelajaran[]` | GPMP, `% A` dan `% lulus` bagi setiap subjek |
| `trend_gps[]` | GPS setiap peperiksaan yang **ada markah**, mengikut susunan baris tab `PEPERIKSAAN` |
| `pbd_tahap[]` | Bilangan rekod mengikut TP. Tahun 1–3 guna lajur `TP` yang diisi guru; Tahun 4–6 dikira daripada markah (90+=TP6, 75+=TP5, 60+=TP4, 45+=TP3, 30+=TP2, selebihnya TP1) |
| `ikut_kelas[]` | GPS dan peratus lulus bagi setiap kelas; `murid` diambil dari senarai calon peperiksaan itu (atau tab `MURID` jika tiada snapshot) |
| `peperiksaan_semua[]` | Blok penuh yang sama bagi **setiap** peperiksaan yang ada markah — inilah sumber pemilih **Peperiksaan** dalam tab Akademik dashboard |

Nota:

- Markah kosong dan `TH` (tidak hadir) **tidak** dikira dalam GPS mahupun
  peratus lulus. `TH` juga tidak masuk taburan TP.
- Jika peperiksaan mempunyai konfigurasi kelas–subjek (lajur F tab
  `PEPERIKSAAN`), hanya subjek dalam konfigurasi itu dikira.
- Nama subjek dikemaskan untuk paparan: `B. MELAYU` → *Bahasa Melayu*,
  `RBT` → *Reka Bentuk & Teknologi*, dan seterusnya.
- Nama peperiksaan panjang dipendekkan pada paksi carta:
  `UJIAN PERTENGAHAN SESI AKADEMIK` → **UPSA**, `PENTAKSIRAN SUMATIF 3` → **PS 3**.
  Nama penuh disimpan dalam `penilaian_penuh`.

---

## 3b. Pemilih peperiksaan dalam dashboard

Tab **Akademik** memaparkan peperiksaan aktif secara lalai, dengan menu
**Peperiksaan** di atas kad-kad carta. Menukar pilihan menukar kad GPMP,
peratus lulus, GPS ikut kelas dan taburan TP kepada peperiksaan itu; nota di
bawah menu menunjukkan peperiksaan mana sedang dilihat dan yang mana aktif.
Kad **Trend GPS** sentiasa memaparkan semua penilaian, dan tile pada tab
Ringkasan kekal mengikut peperiksaan aktif.

Menu hanya muncul apabila ada lebih daripada satu peperiksaan bermarkah.

## 4. Apa yang berlaku bila sesuatu tidak kena

| Keadaan | Kelakuan dashboard |
|---|---|
| SEMAK tidak dapat dibuka (ID salah / tiada akses) | Guna tab `dash_*` dan `tetapan_dashboard` seperti sebelum ini. Ralat dicatat dalam log Apps Script |
| Tab `MARKAH` kosong | Sama seperti di atas |
| Peperiksaan aktif belum ada markah | Guna peperiksaan **terakhir yang ada markah** |
| SEMAK ada markah tetapi tiada TP | Kad PBD guna tab `dash_pbd` jika diisi, jika tidak papar keadaan kosong yang sopan |
| `semak_guna = TIDAK` | SEMAK tidak disentuh langsung |

---

## 5. Privasi

`data.json` ditolak ke repo **awam** `github.com/sepadan/dashboard`. Penyambung
ini hanya mengeluarkan **angka agregat** — tiada nama murid, tiada IC, tiada
markah individu. Nama kelas (cth `4 BIJAK`) dan nama peperiksaan sahaja yang
keluar sebagai teks.
