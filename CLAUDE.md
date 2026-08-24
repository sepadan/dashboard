# Arahan kerja — Ekosistem Data SK Paya Redan

Fail ini mengikat cara kerja pada repo ini. Ia terpakai kepada Claude, ChatGPT, dan sesiapa sahaja yang menyambung kerja di sini.

---

## 1. Sebelum mula

**Baca [`BLUEPRINT.md`](BLUEPRINT.md) dahulu. Ia HAB dokumentasi ekosistem.**

Repo ini memegang hab. Tiga repo lain memegang **jejari** — dokumentasi dalaman
sistem masing-masing:

| Repo | Jejari |
|---|---|
| `sepadan/aksi` | `BLUEPRINT-AKSI.md` |
| `sepadan/hadir` | `BLUEPRINT.md` |
| `sepadan/semak` | `docs/SEMAK-Blueprint.md` |

Jejari menerangkan *bagaimana* satu sistem berfungsi. Hab menerangkan *apa* yang
mengikat kesemuanya — dan memegang **daftar isu tunggal** (bahagian 8).

Jangan mula menulis kod sebelum membacanya. Khususnya:

- **Bahagian 3 — Peraturan yang tidak boleh dilanggar.** Setiap peraturan di situ ialah pepijat yang pernah berlaku dan sudah dibetulkan. Beberapa daripadanya kelihatan seperti kesilapan tetapi sebenarnya betul
- **Bahagian 8 — Daftar isu.** Ini satu-satunya senarai isu dalam seluruh
  ekosistem. Sambung dari situ, bukan dari andaian sendiri. Kalau tuan jumpa
  senarai isu dalam repo jejari, pindahkan ke sini dan buang dari sana
- **Peraturan 3.12 — cara menyemak keadaan sebenar.** `raw.githubusercontent.com`
  dan folder peti masuk Drive kedua-duanya pernah memulangkan salinan seminggu
  lapuk dan menyesatkan sesi penuh

Kalau maklumat dalam `BLUEPRINT.md` bercanggah dengan kod, **kod yang betul**. Betulkan dokumen, jangan andaikan kod salah.

---

## 2. Semasa bekerja

- Repo `sepadan/dashboard` adalah **AWAM**. `data.json` hanya boleh mengandungi angka agregat. Tiada nama murid, tiada IC, tiada markah individu, tiada senarai murid tidak hadir
- Rahsia tidak pernah masuk ke dalam kod — hanya Script Properties
- Jalankan ujian sebelum menghantar. Lihat bahagian 7 `BLUEPRINT.md`
- Bila menambah peraturan domain baharu, tambah ujiannya sekali. Peraturan tanpa ujian akan hilang dalam enam bulan

---

## 3. Selepas selesai — kemas kini `BLUEPRINT.md`

Ini bukan pilihan. Kod berubah tanpa blueprint berubah bermakna blueprint mati, dan sesi berikutnya bermula dengan maklumat palsu.

Dalam **commit yang sama** dengan perubahan kod, kemas kini:

1. **Kerja yang telah disiapkan** — apa yang berubah dan kenapa
2. **Keputusan penting** — pilihan yang dibuat, dan sebabnya. Kalau sesuatu kelihatan pelik tetapi sengaja, tulis sebabnya dalam bahagian 3
3. **Fail atau komponen yang diubah** — kemas kini bahagian 2 dan 4 kalau kontrak berubah
4. **Isu yang masih belum selesai** — bahagian 8
5. **Langkah seterusnya** — bahagian 8, disusun mengikut keutamaan

Kemudian:

- Naikkan nombor versi dan tarikh di bahagian atas
- Tambah satu baris dalam **log perubahan** di bahagian 9

---

## 4. Senarai semak sebelum commit

- [ ] `BLUEPRINT.md` sepadan dengan keadaan sebenar kod
- [ ] Versi dinaikkan, log perubahan ditambah
- [ ] Tiada nama, IC, atau markah individu dalam `data.json`
- [ ] Tiada token atau kata laluan dalam mana-mana fail
- [ ] Semua ujian lulus
- [ ] Peraturan domain baharu ada ujiannya
- [ ] Isu dicatat di bahagian 8 fail hab, bukan dalam repo jejari

---

## 5. Struktur repo

```
index.html      Aplikasi dashboard — satu fail, tiada kebergantungan luar
data.json       Data agregat, ditolak automatik setiap 30 minit
BLUEPRINT.md    Sumber rujukan utama — seni bina, kontrak, peraturan
CLAUDE.md       Fail ini
PANDUAN-DATA.md Rujukan struktur data.json untuk pengguna
README.md       Pengenalan untuk pelawat repo
docs/           Tangkapan skrin
```

Kod Apps Script (`Kod.gs`, `Dashboard.gs`, `Upload.html`) dan ujiannya berada dalam repo **privat** `sistem-kehadiran-sepadan`, bukan di sini.

---

## 6. Bahasa

Semua dokumentasi, komen kod, nama fungsi dalaman, dan mesej kepada pengguna dalam **Bahasa Melayu**.
