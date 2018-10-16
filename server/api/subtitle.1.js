const { promisify } = require("util");

const fs = require("fs");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const TOKEN_PATH = "token.json";

function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  const token = fs.readFileSync(TOKEN_PATH);
  oAuth2Client.setCredentials(JSON.parse(token));
  return oAuth2Client;
}

async function getRow(auth, start, end) {
  const sheets = google.sheets({ version: "v4", auth });
  return await promisify(sheets.spreadsheets.values.get.bind(sheets))({
    spreadsheetId: process.env.sheetId,
    range: `Sheet1!A${start}:F${end}`
  }).then(res => {
    const rows = res.data.values;
    if (rows.length) {
      // Print columns A and E, which correspond to indices 0 and 4.
      return rows;
    } else {
      return console.log("No data found.");
    }
  });
}

async function getRowCount(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  return await promisify(sheets.spreadsheets.get.bind(sheets))({
    spreadsheetId: "1vMLPM9QJBrq-IAOy5wSOJAlPrB0czCdZ-kbG1sbF1Ws",
    ranges: "Sheet1"
  }).then(res => {
    return Number(res.data.sheets[0].properties.gridProperties.rowCount);
  });
}
