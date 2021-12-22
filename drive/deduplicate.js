const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), dedup);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

let drive = null;

async function dedup(auth) {
    drive = google.drive({version: 'v3', auth});

    let duplicates = ("" + fs.readFileSync("duplicates.jsonnl")).split("\n").map(line => JSON.parse(line));
    // set of already processed keys + status
    let progress = ("" + fs.readFileSync("progress.jsonnl")).split("\n").map(line => JSON.parse(line));
    let progressByKey = progress.reduce(
        (acc, item) => (acc[item.key] = item, acc),
        {}
    )

    let countDown = 100;

    for (let i = 0; i < duplicates.length && countDown > 0; i ++) {
        let duplicate = duplicates[i];
        if (!progressByKey[duplicate.key]) {
            let result = await deduplicate(duplicate);
            progressByKey[duplicate.key] = {
                key: duplicate.key,
                result: result
            };
            countDown --;
            progress = Object.values(progressByKey);
            fs.writeFileSync("progress.jsonnl",
                progress.map(i => JSON.stringify(i)).join("\n"));
        }
    }

}

async function deduplicate(duplicate) {
    for (let i = 0; i < duplicate.items.length; i ++) {
        let item = duplicate.items[i];
        item.permissions = await drive.permissions.list({
            fileId: item.id
        })
    }
    console.log(duplicate.key);
    const noneShared = duplicate.items.filter( 
            item => item.permissions.data.permissions.length != 1 //not owner only
    ).length == 0;
    if (!noneShared)
        return "SHARED";

    // select the first as the one to be kept
    let kept = duplicate.items[0];

    for (let i = 1; i < duplicate.items.length; i ++) {
        let item = duplicate.items[i];
        let shortcut = await drive.files.create({
            'fields': 'id,name,mimeType,shortcutDetails',
            'resource': {
                'name': kept.name,
                'mimeType': 'application/vnd.google-apps.shortcut',
                'parents': item.parents,
                'shortcutDetails': {
                    'targetId': kept.id
                }
            }
        });
        await drive.files.update({
            fileId: item.id,
            requestBody: {
                trashed: true
            }
        });
    }
    return "OK";
}