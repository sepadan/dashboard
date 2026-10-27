'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function backend(){
  const ctx = vm.createContext({});
  const file = path.join(__dirname, '..', 'apps-script', 'AnalisisHarian.js');
  assert.ok(fs.existsSync(file), 'Modul agregat harian mesti wujud');
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  return (data, head, year, today, eligible) => JSON.parse(JSON.stringify(ctx.agregatKehadiranHarian_(data, head, year, today, eligible)));
}
test('baris murid tanpa kelas kekal dalam jumlah sekolah tanpa mendedahkan identiti',()=>{
 const head=['BIL','NAMA','KELAS','IC','27/10'];
 const rows=[head,[1,'RAHSIA','','000000000001','1'],['','','','','']];
 const r=backend()(rows,head,'2026','2026-10-27')[0];
 assert.equal(r.hadir,1); assert.equal(r.ikut_kelas[0].kelas,'(tiada kelas)');
});
test('penjana menyertakan harian dan hari_ini dengan jumlah yang sama serta menapis arkib',()=>{
  const head=['BIL','NAMA','KELAS','IC','27/10'];
  const data=[head,[1,'RAHSIA','1 BIJAK','000000000001','1'],[2,'RAHSIA','1 BIJAK','000000000002','0']];
  const ctx=vm.createContext({DASH_BULAN:{'10':'Okt'},petaGuruBulanan_:()=>({}),peratus_:(a,b)=>b?Math.round(a/b*1000)/10:0,Utilities:{formatDate:(_d,_tz,f)=>({'yyyy-MM-dd':'2026-10-27','yyyy':'2026','HH:mm':'10:00',d:'27',M:'10'}[f])},dapatkanIntervalArkib_:()=>({}),dapatkanIcAktifMain_:()=>({}),muridTiadaPadaTarikh_:(ic)=>ic==='000000000002'});
  for(const f of ['AnalisisHarian.js','KiraKehadiran.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..','apps-script',f),'utf8'),ctx);
  const sheet={getLastRow:()=>data.length,getLastColumn:()=>head.length,getRange:()=>({getDisplayValues:()=>data})};
  const ss={getSheetByName:n=>n==='kehadiran'?sheet:null};
  const result=ctx.kiraKehadiran_(ss,{sesi:'2026'});
  assert.ok(Array.isArray(result.harian));
  assert.equal(result.harian[0].jumlah,1);
  assert.equal(result.hari_ini.hadir,result.harian[0].hadir);
  assert.equal(result.hari_ini.tidak_hadir,0);
});
test('kelayakan murid menggunakan rekod arkib pada tarikh analisis, bukan enrolmen semasa',()=>{
  const head=['BIL','NAMA','KELAS','IC','26/10','27/10'];
  const data=[head,[1,'RAHSIA','1 BIJAK','000000000001','1','1']];
  const result=backend()(data,head,'2026','2026-10-27',(row,iso)=>iso<'2026-10-27');
  assert.equal(result[0].jumlah,1); assert.equal(result[1].jumlah,0); assert.equal(result[1].peratus,null);
});
test('agregat menolak tarikh tidak sah/sesi lain/masa hadapan dan tidak menganggap kosong sebagai 0%',()=>{
  const head=['BIL','NAMA','KELAS','IC','31/02','29/02/2026','27-10-26','27/10/2026','26.10.2026','28/10','25/10/2025'];
  const data=[head,[1,'RAHSIA','1 BIJAK','000000000001','1','1','','0','n/a','1','1']];
  const result=backend()(data,head,'2026','2026-10-27');
  assert.deepEqual(result.map(r=>r.tarikh),['2026-10-26','2026-10-27']);
  assert.equal(result[0].peratus,null); assert.equal(result[0].belum_ditanda,1);
  assert.equal(result[1].peratus,null); // pendua tarikh tidak menggandakan murid
  assert.deepEqual(backend()(data,head,'','2026-10-27'),[]);
});
test('agregat harian membezakan belum ditanda dan bukan murid pada tarikh itu, semua kelas dan privasi',()=>{
  const head=['BIL','NAMA','KELAS','IC','26/10','27/10','28/10'];
  const data=[head,[1,'RAHSIA A','1 BIJAK','000000000001','1','1',''],[2,'RAHSIA B','1 BIJAK','000000000002','0','',''],[3,'RAHSIA C','2 CERDIK','000000000003','—','0',''],[4,'RAHSIA D','2 CERDIK','000000000004','','1','']];
  const result=backend()(data,head,'2026','2026-10-27');
  assert.equal(result.length,2);
  assert.deepEqual(result[1],{tarikh:'2026-10-27',hadir:2,tidak_hadir:1,ditanda:3,belum_ditanda:1,jumlah:4,peratus:66.7,ikut_kelas:[{kelas:'1 BIJAK',hadir:1,tidak_hadir:0,ditanda:1,belum_ditanda:1,jumlah:2,peratus:100},{kelas:'2 CERDIK',hadir:1,tidak_hadir:1,ditanda:2,belum_ditanda:0,jumlah:2,peratus:50}]});
  assert.equal(result[0].jumlah,3);
  assert.doesNotMatch(JSON.stringify(result),/RAHSIA|00000000000/);
});
