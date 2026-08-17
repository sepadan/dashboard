# Langkah Naik ke GitHub

Panduan ini untuk naik buat kali pertama, tanpa perlu pasang apa-apa perisian. Anggaran masa: **5 minit**.

---

## Bahagian 1 — Buat repositori

1. Log masuk ke [github.com](https://github.com). Jika belum ada akaun, daftar dahulu (percuma).
2. Klik butang **+** di penjuru kanan atas → **New repository**.
3. Isi:

   | Ruang | Nilai |
   |---|---|
   | Repository name | `dashboard-sepadan` |
   | Description | `Dashboard prestasi sekolah dalam satu fail HTML — SK Paya Redan` |
   | Visibility | **Public** |
   | Add a README file | **Jangan tanda** (kita sudah ada README sendiri) |
   | Add .gitignore | **None** |
   | Choose a license | **None** |

4. Klik **Create repository**.

---

## Bahagian 2 — Naikkan fail

Selepas repositori dibuat, GitHub akan tunjuk halaman kosong dengan beberapa pautan.

1. Klik **uploading an existing file** (dalam ayat *"…or upload an existing file"*).
2. Buka folder `github-dashboard-sepadan` pada komputer.
3. **Pilih semua kandungan folder** (Ctrl+A) — termasuk folder `docs` — kemudian **seret masuk** ke kawasan bertanda pada halaman GitHub.

   > Seret **isi folder**, bukan folder induk. Jika tuan seret folder induk, semua fail akan masuk ke dalam subfolder dan GitHub Pages tidak akan jumpa `index.html`.

4. Tunggu sehingga semua fail selesai dimuat naik (ada 14 fail: 8 di akar + 6 dalam folder docs).
5. Di bahagian bawah, dalam kotak **Commit changes**, taip:

   ```
   Versi pertama Dashboard SePadan
   ```

6. Klik **Commit changes**.

**Nota:** fail `.nojekyll` bermula dengan titik, jadi ia mungkin tersembunyi dalam File Explorer. Tekan **Ctrl+Shift+H** (Windows 11) atau tandakan *Hidden items* pada tab **View** untuk melihatnya sebelum memilih semua.

---

## Bahagian 3 — Hidupkan GitHub Pages

Ini yang membolehkan dashboard dibuka terus melalui pautan web.

1. Dalam repositori, klik tab **Settings**.
2. Menu kiri → **Pages**.
3. Di bawah **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** · folder: **/ (root)**
4. Klik **Save**.
5. Tunggu 1–2 minit, kemudian muat semula halaman itu. Pautan akan muncul di bahagian atas:

   ```
   https://<nama-pengguna>.github.io/dashboard-sepadan/
   ```

Buka pautan itu — dashboard akan terus memuat `data.json` dari repositori.

---

## Bahagian 4 — Kemas kini data selepas ini

Setiap kali data sekolah berubah, tuan hanya perlu ganti `data.json`:

1. Buka repositori → klik fail **data.json**
2. Klik ikon pensel (**Edit this file**)
3. Padam kandungan lama, tampal kandungan baharu
4. Klik **Commit changes**

Dalam masa seminit, pautan GitHub Pages akan menunjukkan data terkini. Tiada perkara lain perlu dibuat.

**Cara lebih automatik:** jika `data.json` dijana oleh Google Apps Script atau sistem sekolah, gunakan GitHub API atau `git push` berjadual untuk menggantikan fail tanpa campur tangan manusia. Rujuk [PANDUAN-DATA.md](PANDUAN-DATA.md) bahagian 4.

---

## Amaran keselamatan

Repositori ini **awam** — sesiapa sahaja boleh melihat kandungan `data.json`.

- ✅ Selamat: angka agregat (jumlah murid, peratus kehadiran, GPS, bilangan penerima bantuan)
- ❌ **Jangan** naikkan: nama murid, nombor kad pengenalan, alamat rumah, nama penerima bantuan, markah individu

`.gitignore` dalam folder ini sudah menghalang fail bernama `data-sebenar.json` atau `data-*.json` daripada tersilap naik. Gunakan nama itu untuk fail kerja tuan yang mengandungi data mentah.

Jika tuan perlu memaparkan data sensitif, tukar repositori kepada **Private** (Settings → General → Danger Zone → Change visibility). Ambil perhatian: GitHub Pages untuk repositori peribadi memerlukan pelan berbayar.

---

## Jika ada masalah

| Masalah | Punca & penyelesaian |
|---|---|
| Pautan Pages tunjuk "404" | `index.html` tidak berada di akar repositori — ia mungkin masuk ke dalam subfolder. Padam fail, ulang muat naik dengan menyeret **isi** folder |
| Dashboard buka tapi guna data contoh | `data.json` tiada di akar, atau nama fail salah eja |
| Carta tidak keluar | Buka pautan dengan `https://`, bukan `file://`. Cuba tekan Ctrl+F5 |
| Perubahan tidak muncul | Cache pelayar. Tekan Ctrl+F5, atau tunggu 2 minit untuk GitHub Pages membina semula |
