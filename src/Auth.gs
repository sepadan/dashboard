// Auth.gs

function hashPassword(password) {
  var rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return rawHash.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function login(id, password) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PENGGUNA');

    if (!sheet) {
      return {
        berjaya: false,
        mesej: 'Sistem tidak dikonfigurasi.'
      };
    }

    var data = sheet.getDataRange().getValues();
    var hash = hashPassword(password);

    for (var i = 1; i < data.length; i++) {
      var idPengguna = data[i][0];
      var peranan = data[i][1];
      var passwordHash = data[i][2];

      if (idPengguna === id && passwordHash === hash) {
        var token = buatToken(id, peranan);
        logAktiviti(id, 'LOGIN', 'Berjaya log masuk');
        return {
          berjaya: true,
          token: token,
          peranan: peranan
        };
      }
    }

    return {
      berjaya: false,
      mesej: 'ID atau password tidak betul.'
    };
  } catch(e) {
    return {
      berjaya: false,
      mesej: 'Ralat sistem: ' + e.toString()
    };
  }
}

function buatToken(id, peranan) {
  var token = Utilities.getUuid();
  var sesi = {
    id: id,
    peranan: peranan,
    masa: new Date().getTime()
  };
  PropertiesService.getScriptProperties()
    .setProperty('SESI_' + token,
      JSON.stringify(sesi));
  return token;
}

function semakSesi(token) {
  if (!token) return null;
  var prop = PropertiesService.getScriptProperties()
    .getProperty('SESI_' + token);
  if (!prop) return null;

  var sesi = JSON.parse(prop);
  var lapan_jam = 8 * 60 * 60 * 1000;
  var sekarang = new Date().getTime();

  if (sekarang - sesi.masa > lapan_jam) {
    PropertiesService.getScriptProperties()
      .deleteProperty('SESI_' + token);
    return null;
  }
  return sesi;
}

function logout(token) {
  if (!token) return;
  PropertiesService.getScriptProperties()
    .deleteProperty('SESI_' + token);
}

function logAktiviti(pengguna, tindakan, butiran) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('LOG_AKTIVITI');
    if (!sheet) return;
    var masa = new Date().toLocaleString('ms-MY');
    sheet.appendRow([masa, pengguna, tindakan, butiran]);
  } catch(e) {}
}
