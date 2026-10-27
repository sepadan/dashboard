# Penjana analisis harian

Dua fail ini ialah sumber tambahan untuk projek KEHADIRAN, bukan aplikasi web
baharu dan bukan salinan keseluruhan backend HADIR.

- `AnalisisHarian.js`: pengagregat tulen; tiada operasi tulis sumber.
- `KiraKehadiran.js`: pengganti **fungsi** `kiraKehadiran_` dalam `Dashboard.js`.

## Penerbitan selamat

1. Ambil kandungan HEAD Apps Script terkini melalui API atau `clasp clone` dalam
   folder berasingan. Jangan tolak klon lama kerana projek dikongsi oleh HADIR.
2. Ganti hanya blok `function kiraKehadiran_` dalam `Dashboard.js` dengan kandungan
   `KiraKehadiran.js`; kekalkan semua fungsi dan fail lain.
3. Tambah `AnalisisHarian.js`. **Jangan** tambah `KiraKehadiran.js` sebagai fail
   berasingan dalam projek — mesti ada tepat satu definisi `kiraKehadiran_`.
4. Jalankan `node --test tests/*.test.cjs` dari root repo. Bandingkan sumber
   jauh dengan sumber sebelum perubahan untuk mengesahkan fail lain tidak berubah.
5. Simpan versi Apps Script sebagai checkpoint. Pemicu `hantarDataKeGitHub`
   berjalan pada HEAD, jadi tidak perlu mengubah deployment web HADIR.
6. Sahkan `data.json` yang dijana benar-benar mempunyai `kehadiran.harian`,
   tarikh unik, jumlah kelas sepadan angka sekolah dan tiada medan individu.
   Jangan hasilkan `data.json` rekaan atau menolaknya secara manual.

## Pengiraan dan had sumber

`peratus = hadir / ditanda × 100`, satu tempat perpuluhan. Tiada murid ditanda
menghasilkan `null`, bukan sifar. `jumlah = ditanda + belum_ditanda`. 1 (termasuk
PDPR) hadir, 0 tidak hadir, sel kosong/nilai tidak dikenali belum ditanda,
`—` atau `-` bukan murid yang layak pada tarikh itu. Kelayakan juga diperiksa
menggunakan tempoh arkib, bukan enrolmen semasa untuk semua tarikh lampau.

Tarikh mesti sah, sepadan sesi tahun 4 digit dan tidak melepasi hari ini (Malaysia).
Setiap lajur tarikh sebenar dimasukkan, termasuk yang belum ditanda; ini tidak
mereka kalendar cuti atau menganggap kelas kosong sebagai tidak hadir.

Sumber `kehadiran` boleh menggugurkan baris arkib selepas bulan berakhir.
Sejarah hanya meliputi rekod yang masih wujud; data dipadam tidak direka semula.
Paparan awam mesti menerangkan batas liputan ini. Tiada nama, IC, sebab individu,
PIN, kata laluan atau token boleh masuk output.

## Checkpoint 27 Oktober 2026

HEAD dibaca semula dan sepadan selepas hanya fungsi integrasi diubah dan modul
agregat ditambah. Versi awal **127** ialah checkpoint integrasi; versi akhir
**128** menyertakan pengendalian murid tanpa kelas. Deployment web HADIR kekal
**126**. Pemicu pada 11:47 menerbitkan data sebenar, dan laman produksi disahkan
pada telefon serta desktop. Lihat `../docs/RELEASE-2026-10-27-HARIAN.md`.
