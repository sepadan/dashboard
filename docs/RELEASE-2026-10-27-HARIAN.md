# Pengesahan analisis kehadiran harian — 27 Oktober 2026

## Diterbitkan

- Kod paparan: `78b1a58`; hasil data automatik pertama: `ca933e5`.
- Apps Script HEAD dan checkpoint **128**: integrasi penjana + modul agregat.
  Baca balik API mengesahkan hanya fungsi penjana berubah dan modul ditambah;
  Code, HadirWeb, Upload dan manifest kekal. Deployment web HADIR **126** tidak diubah.
- GitHub Pages bagi kedua-dua commit berjaya.

## Bukti data sebenar

Pemicu awan menerbitkan `harian[]` pada 11:47 MYT tanpa suntingan manual
pada data.json. Ada **191 tarikh**, dari **22 Januari hingga 27 Oktober 2026**,
dan **9 kelas** pada tarikh terkini. Termasuk tarikh tanpa tanda dan rekod
separa; ini bukan dakwaan 191 hari lengkap. Pengesahan kontrak memastikan
jumlah sekolah bersamaan jumlah kelas, serta peratus dan penyebut konsisten.

Rekod 27 Oktober: **220 hadir, 4 tidak hadir, 224 ditanda, 0 belum ditanda,
98.2%**. Tiada nama atau IC diterbitkan.

## Pengesahan

- Ujian Node backend, UI dan kontrak/privasi lulus terhadap data sebenar terkini.
- Semakan teknikal bebas selesai; dapatan sah dibaiki, termasuk pelolosan
  jadual dan bayang data global yang boleh menyekat muatan data rangkaian.
- Playwright pada laman produksi: **390 × 844** dan **1440 × 900**;
  191 pilihan tarikh, pertukaran tarikh/bulan, 9 baris kelas, rekod tanpa tanda,
  registry carta stabil selepas pertukaran berulang, Mod TV dan pemulihan
  selepas Escape. Tiada ralat JavaScript atau limpahan lebar halaman.
- Tangkapan telefon/desktop diperiksa secara visual.

## Batas

Analisis membaca rekod yang masih ada pada sumber. Rekod murid yang telah
dibuang tidak boleh dibina semula. Peratus hanya berdasarkan murid ditanda;
pengisian separa diberi amaran dan nilai tanpa tanda kekal `null`/`—`.
Penyegaran awan kekal setiap 30 minit; komputer pengguna tidak perlu hidup.
