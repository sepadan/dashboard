// PushKeGitHub.gs — tolak sumber projek AKSI ke repo GitHub
// Tetapan dalam Project Settings > Script Properties:
//   GITHUB_TOKEN  = personal access token (fine-grained; Contents: Read and write)
//   GITHUB_OWNER  = sepadan
//   GITHUB_REPO   = aksi
//   GITHUB_BRANCH = main   (pilihan; lalai 'main')
//
// Perlu juga: Apps Script API DIHIDUPKAN di https://script.google.com/home/usersettings
// dan skop script.projects.readonly + script.external_request dalam appsscript.json.

function pushSemuaFailKeGitHub() {
  var t = tetapanGitHub_();
  var fail = bacaSumberProjek_();
  var hasil = [];
  for (var i = 0; i < fail.length; i++) {
    var f = fail[i];
    var ext = f.type === 'SERVER_JS' ? '.gs' : (f.type === 'HTML' ? '.html' : '.json');
    var laluan = 'src/' + f.name + ext;
    hasil.push(laluan + '  ->  ' + hantarFail_(t, laluan, f.source || ''));
    Utilities.sleep(300);
  }
  var ringkasan = hasil.join('\n');
  Logger.log(ringkasan);
  return ringkasan;
}

function tetapanGitHub_() {
  var p = PropertiesService.getScriptProperties();
  var t = {
    token: p.getProperty('GITHUB_TOKEN'),
    owner: p.getProperty('GITHUB_OWNER'),
    repo: p.getProperty('GITHUB_REPO'),
    branch: p.getProperty('GITHUB_BRANCH') || 'main'
  };
  if (!t.token || !t.owner || !t.repo) {
    throw new Error('Sila isi GITHUB_TOKEN, GITHUB_OWNER dan GITHUB_REPO dalam Script Properties.');
  }
  return t;
}

function bacaSumberProjek_() {
  var url = 'https://script.googleapis.com/v1/projects/' + ScriptApp.getScriptId() + '/content';
  var res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Gagal baca sumber projek (HTTP ' + res.getResponseCode() +
      '). Hidupkan Apps Script API di https://script.google.com/home/usersettings. ' +
      res.getContentText().slice(0, 300));
  }
  return JSON.parse(res.getContentText()).files || [];
}

function hantarFail_(t, laluan, isi) {
  var base = 'https://api.github.com/repos/' + t.owner + '/' + t.repo + '/contents/' + laluan;
  var sha = null;
  var semak = UrlFetchApp.fetch(base + '?ref=' + encodeURIComponent(t.branch), {
    headers: kepalaGh_(t.token), muteHttpExceptions: true
  });
  if (semak.getResponseCode() === 200) {
    sha = JSON.parse(semak.getContentText()).sha;
  }
  var muatan = {
    message: 'AKSI: kemas kini ' + laluan,
    content: Utilities.base64Encode(isi, Utilities.Charset.UTF_8),
    branch: t.branch
  };
  if (sha) muatan.sha = sha;
  var res = UrlFetchApp.fetch(base, {
    method: 'put',
    contentType: 'application/json',
    headers: kepalaGh_(t.token),
    payload: JSON.stringify(muatan),
    muteHttpExceptions: true
  });
  var kod = res.getResponseCode();
  if (kod === 200 || kod === 201) return 'OK';
  return 'GAGAL ' + kod + ' ' + res.getContentText().slice(0, 200);
}

function kepalaGh_(token) {
  return {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

// Jalankan ini DAHULU untuk semak semua tetapan sebelum push penuh.
function ujiTetapanGitHub() {
  var t = tetapanGitHub_();
  var lapor = [];
  lapor.push('Repo   : ' + t.owner + '/' + t.repo + ' (' + t.branch + ')');
  var r1 = UrlFetchApp.fetch('https://api.github.com/repos/' + t.owner + '/' + t.repo, {
    headers: kepalaGh_(t.token), muteHttpExceptions: true
  });
  lapor.push('GitHub : HTTP ' + r1.getResponseCode() +
    (r1.getResponseCode() === 200 ? ' OK' : ' - ' + r1.getContentText().slice(0, 150)));
  try {
    var fail = bacaSumberProjek_();
    lapor.push('Sumber : OK, ' + fail.length + ' fail dijumpai');
  } catch (err) {
    lapor.push('Sumber : ' + err.message);
  }
  var hasil = lapor.join('\n');
  Logger.log(hasil);
  return hasil;
}
