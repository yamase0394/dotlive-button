const AsyncLock = require("async-lock");
const lock = new AsyncLock();
const shortid = require("shortid");
const { promisify } = require("util");
const { google } = require("googleapis");
const slack = require(`${process.cwd()}/server/slackbot`);
const youtubeClient = require("./youtubeClient");
require("dotenv").config();

const db = {};

slack.controller.hears("update:video-info", "direct_mention", async function(
  bot,
  message
) {
  try {
    await initVideoSheet();
    bot.reply(message, "ok");
  } catch (e) {
    bot.reply(message, `failed to init video sheet. \r\n ${e}`);
    throw e;
  }
});
slack.controller.hears("update:subtitle", "direct_mention", async function(
  bot,
  message
) {
  try {
    await initSubtitleSheet();
    bot.reply(message, "ok");
  } catch (e) {
    bot.reply(message, `failed to init subtitle sheet. \r\n ${e}`);
    throw e;
  }
});

const auth = authorize({
  installed: {
    client_id: process.env.sheet_client_id,
    project_id: process.env.sheet_project_id,
    auth_uri: process.env.sheet_auth_uri,
    token_uri: process.env.sheet_token_uri,
    auth_provider_x509_cert_url: process.env.sheet_auth_provider_x509_cert_url,
    client_secret: process.env.sheet_client_secret,
    redirect_uris: [
      process.env.sheet_redirect_uris_0,
      process.env.sheet_redirect_uris_1
    ]
  }
});
const sheets = google.sheets({ version: "v4", auth });
function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = {
    access_token: process.env.sheet_token_access_token,
    refresh_token: process.env.sheet_token_refresh_token,
    scope: process.env.sheet_token_scope,
    token_type: process.env.sheet_token_type,
    expiry_date: process.env.sheet_token_expiry_date
  };
  console.log(token);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

const spreadsheetId =
  process.env.NODE_ENV === "production"
    ? process.env.SPREADSHEET_ID
    : process.env.SPREADSHEET_ID_DEV;
const uploadCaptionSpreadsheetId =
  process.env.NODE_ENV === "production"
    ? process.env.UPLOAD_CAPTION_SPREADSHEET_ID
    : process.env.UPLOAD_CAPTION_SPREADSHEET_ID_DEV;
db.createSheet = async title => {
  return await promisify(sheets.spreadsheets.batchUpdate.bind(sheets))({
    spreadsheetId: uploadCaptionSpreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: title
            }
          }
        }
      ]
    }
  })
    .then(res => {
      slack.say(`createSheet\r\n${JSON.stringify(res.data)}`);
      return { result: "success" };
    })
    .catch(e => {
      if (e.toString().includes("別の名前を入力してください")) {
        slack.say(e.toString());
        return {
          result: "failed",
          message: "この動画の字幕は既に存在しています"
        };
      } else {
        slack.say(e.toString());
        return { result: "failed", message: "不明なエラー" };
      }
    });
};

db.writeToSheet = async (title, items) => {
  return await promisify(sheets.spreadsheets.values.update.bind(sheets))({
    spreadsheetId: uploadCaptionSpreadsheetId,
    range: title,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: items
    }
  })
    .then(res => {
      slack.say(`writeToSheet\r\n${JSON.stringify(res.data)}`);
      return { result: "success" };
    })
    .catch(e => {
      slack.say(e.toString());
      return { result: "failed", message: "不明なエラー" };
    });
};

const channelIdToData = new Map();

let videoSheetVersion;
const videoIdToVideoInfos = new Map();
const channelIdToVideoInfos = new Map();
try {
  initVideoSheet();
} catch (e) {
  slack.say(`failed to init video sheet. \r\n ${e}`);

  throw e;
}

let subtitleSheetVersion;
const subtitles = [];
const videoIdToSubtitles = new Map();
const channelIdToSubtitles = new Map();
try {
  initSubtitleSheet();
} catch (e) {
  slack.say(`failed to init subtitle sheet. \r\n ${e}`);

  throw e;
}

db.getChannelInfo = async function(channelId) {
  const res = await lock.acquire(Object.keys({ channelIdToData })[0], () => {
    return channelIdToData.get(channelId);
  });

  if (res != null) {
    return res;
  }

  const items = await youtubeClient.getChannelInfo(channelId);
  lock.acquire(Object.keys({ channelIdToData })[0], () => {
    channelIdToData.set(channelId, items[0].snippet);
  });
  return items[0].snippet;
};

db.getVideoInfos = async function() {
  return await lock.acquire(Object.keys({ videoIdToVideoInfos })[0], () => {
    if (videoIdToVideoInfos.size === 0) {
      throw new Error("videoIdToVideoInfos is empty");
    }

    return [...videoIdToVideoInfos.values()];
  });
};

db.getVideoInfoByVideoId = async function(videoId) {
  return await lock.acquire(Object.keys({ videoIdToVideoInfos })[0], () => {
    if (!videoIdToVideoInfos.has(videoId)) {
      throw new Error(`unknown video id:${videoId}`);
    }

    return videoIdToVideoInfos.get(videoId);
  });
};

db.getVideoInfoByChannelId = async function(channelId) {
  return await lock.acquire(Object.keys({ channelIdToVideoInfos })[0], () => {
    if (!channelIdToVideoInfos.has(channelId)) {
      throw new Error(`unknown channel id:${channelId}`);
    }

    return channelIdToVideoInfos.get(channelId);
  });
};

async function initVideoSheet() {
  await lock.acquire(
    [
      Object.keys({ videoSheetVersion })[0],
      Object.keys({ videoIdToVideoInfos })[0],
      Object.keys({ channelIdToVideoInfos })[0]
    ],
    async () => {
      console.log(`clear:${Object.keys({ videoIdToVideoInfos })[0]}`);
      console.log(`clear:${Object.keys({ channelIdToVideoInfos })[0]}`);
      videoIdToVideoInfos.clear();
      channelIdToVideoInfos.clear();

      await initVideoInfos();

      videoSheetVersion = shortid.generate();
    }
  );
}

async function initVideoInfos() {
  console.log(`fetch video info`);

  const dataList = await fetchVideoInfo();
  for (let data of dataList) {
    const videoId = data[1];
    videoIdToVideoInfos.set(videoId, data);

    const channelId = data[0];
    if (channelIdToVideoInfos.has(channelId)) {
      channelIdToVideoInfos.get(channelId).push(data);
    } else {
      channelIdToVideoInfos.set(channelId, [data]);
    }
  }

  console.log("compelete fetching video");
}

async function fetchVideoInfo() {
  return await promisify(sheets.spreadsheets.values.get.bind(sheets))({
    spreadsheetId: spreadsheetId,
    range: `videoInfo`
  }).then(res => {
    const rows = res.data.values;
    if (rows.length) {
      return rows;
    } else {
      console.log("data not found");
      throw new Error("data not found");
    }
  });
}

db.getSubtitleRange = async function(page, itemPerPage) {
  return await lock.acquire(Object.keys({ subtitles })[0], () => {
    const pageCount = Math.ceil(subtitles.length / itemPerPage);
    const pageNumber = Math.min(page, pageCount);
    const rangeStart = (pageNumber - 1) * itemPerPage;
    const rangeEnd = pageNumber * itemPerPage;
    console.log(`range:${rangeStart}-${rangeEnd}`);

    return [pageCount, subtitles.slice(rangeStart, rangeEnd)];
  });
};

db.getSubtitleRangeByChannelId = async function(id, page, itemPerPage) {
  return await lock.acquire(Object.keys({ channelIdToSubtitles })[0], () => {
    const items = channelIdToSubtitles.get(id);
    if (!items || items.length === 0) {
      return [1, []];
    }

    const pageCount = Math.ceil(items.length / itemPerPage);
    const pageNumber = Math.min(page, pageCount);
    const rangeStart = (pageNumber - 1) * itemPerPage;
    const rangeEnd = pageNumber * itemPerPage;
    console.log(`channel:${id}, range:${rangeStart}-${rangeEnd}`);

    return [pageCount, items.slice(rangeStart, rangeEnd)];
  });
};

db.getSubtitleByVideoId = async function(id) {
  return await lock.acquire(
    Object.keys({ videoIdToSubtitles })[0],
    async () => {
      if (videoIdToSubtitles.size === 0) {
        await initVideoIdToSubtitles();
      }

      if (videoIdToSubtitles.size === 0) {
        throw new Error(`video:${id} video does not exist`);
      }

      const result = videoIdToSubtitles.get(id);
      if (result) {
        return result;
      }
      return [];
    }
  );
};

db.getRandomSubtitles = async function(count) {
  return await lock.acquire(Object.keys({ subtitles })[0], () => {
    const result = new Set();
    while (result.size <= count) {
      result.add(subtitles[Math.floor(Math.random() * subtitles.length)]);
    }
    return [...result];
  });
};

db.getChannelContainsSubtitle = async function() {
  return await lock.acquire(Object.keys({ channelIdToSubtitles })[0], () => {
    return [...channelIdToSubtitles.keys()];
  });
};

db.getChannelList = function() {
  return [
    "UC02LBsjt_Ehe7k0CuiNC6RQ",
    "UC1519-d1jzGiL1MPTxEdtSA",
    "UC5nfcGkOAm3JwfPvJvzplHg",
    "UC6TyfKcsrPwBsBnx2QobVLQ",
    "UCiGcHHHT3kBB1IGOrv7f3qQ",
    "UCKUcnaLsG2DeQqza8zRXHiA",
    "UCLhUvJ_wO9hOvv_yYENu4fQ",
    "UCmM5LprTu6-mSlIiRNkiXYg",
    "UCMzxQ58QL4NNbWghGymtHvw",
    "UCOefINa2_BmpuX4BbHjdk9A",
    "UCP9ZgeIJ3Ri9En69R0kJc9Q",
    "UCUZ5AlC3rTlM-rA2cj5RP6w",
    "UCyb-cllCkMREr9de-hoiDrg",
    "UCz6Gi81kE6p5cdW1rT0ixqw"
  ];
};

db.searchSubtitle = async (searchText, page, itemPerPage) => {
  const searchRegs = searchText.split(/\s+/).map(str => new RegExp(str, "i"));
  const items = await lock.acquire(Object.keys({ subtitles })[0], () => {
    return subtitles.filter(e => searchRegs.every(reg => reg.test(e[2])));
  });
  if (items.length === 0) {
    return [0, 1, []];
  }

  const pageCount = Math.ceil(items.length / itemPerPage);
  const pageNumber = Math.min(page, pageCount);
  const rangeStart = (pageNumber - 1) * itemPerPage;
  const rangeEnd = pageNumber * itemPerPage;
  console.log(`range:${rangeStart}-${rangeEnd}`);

  return [items.length, pageCount, items.slice(rangeStart, rangeEnd)];
};

db.searchSubtitleFromChannel = async (
  searchText,
  channelId,
  page,
  itemPerPage
) => {
  const searchRegs = searchText.split(/\s+/).map(str => new RegExp(str, "i"));
  const items = await lock.acquire(
    Object.keys({ channelIdToSubtitles })[0],
    () => {
      const target = channelIdToSubtitles.get(channelId);
      if (target) {
        return target.filter(e => searchRegs.every(reg => reg.test(e[2])));
      } else {
        return [];
      }
    }
  );
  if (items.length === 0) {
    return [0, 1, []];
  }

  const pageCount = Math.ceil(items.length / itemPerPage);
  const pageNumber = Math.min(page, pageCount);
  const rangeStart = (pageNumber - 1) * itemPerPage;
  const rangeEnd = pageNumber * itemPerPage;
  console.log(`channel:${channelId}, range:${rangeStart}-${rangeEnd}`);

  return [items.length, pageCount, items.slice(rangeStart, rangeEnd)];
};

async function initSubtitleSheet() {
  await lock.acquire(
    [
      Object.keys({ subtitleSheetVersion })[0],
      Object.keys({ subtitles })[0],
      Object.keys({ channelIdToSubtitles })[0],
      Object.keys({ videoIdToSubtitles })[0]
    ],
    async () => {
      console.log(`clear:${Object.keys({ subtitles })[0]}`);
      console.log(`clear:${Object.keys({ channelIdToSubtitles })[0]}`);
      console.log(`clear:${Object.keys({ videoIdToSubtitles })[0]}`);
      subtitles.length = 0;
      channelIdToSubtitles.clear();
      videoIdToSubtitles.clear();

      await initSubtitles();
      await initChannelIdToSubtitles();
      await initVideoIdToSubtitles();

      subtitleSheetVersion = shortid.generate();
    }
  );
}

async function initSubtitles() {
  console.log("init subtitles");

  const resultSubtitles = await promisify(
    sheets.spreadsheets.values.get.bind(sheets)
  )({
    spreadsheetId: spreadsheetId,
    range: "Sheet1"
  }).then(res => {
    const rows = res.data.values;
    rows.shift();
    if (rows.length) {
      return rows;
    } else {
      throw new Error("subtitle sheet is empty");
    }
  });

  Array.prototype.push.apply(subtitles, resultSubtitles);
  console.log("complete init subtitles");
}

async function initChannelIdToSubtitles() {
  subtitles.forEach(e => {
    if (channelIdToSubtitles.has(e[3])) {
      channelIdToSubtitles.get(e[3]).push(e);
    } else {
      channelIdToSubtitles.set(e[3], [e]);
    }
  });
}

async function initVideoIdToSubtitles() {
  subtitles.forEach(e => {
    if (videoIdToSubtitles.has(e[4])) {
      videoIdToSubtitles.get(e[4]).push(e);
    } else {
      videoIdToSubtitles.set(e[4], [e]);
    }
  });
}

db.getVersion = async type => {
  switch (type) {
    case "video":
      return await lock.acquire(Object.keys({ videoSheetVersion })[0], () => {
        return videoSheetVersion;
      });
    case "subtitle":
      return await lock.acquire(
        Object.keys({ subtitleSheetVersion })[0],
        () => {
          return subtitleSheetVersion;
        }
      );
  }
};

module.exports = db;
