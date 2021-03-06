var express = require("express");
var router = express.Router();
const db = require(`../../db/db`);
const captionAsr = require(`../../db/captionAsr`);
const slack = require(`${process.cwd()}/server/slackbot`);
require("dotenv").config();

const captionManager =
  process.env.NODE_ENV === "production"
    ? process.env.CAPTION_MANAGER_NAME
    : process.env.CAPTION_MANAGER_NAME_DEV;

router.post("/", async function(req, res, next) {
  try {
    await db.createSheet(req.body.videoId);
    await db.writeToSheet(req.body.videoId, req.body.items);

    slack.say(`<@${captionManager}> newSheet:${req.body.videoId}`);

    res.send({ result: "success" });
  } catch (e) {
    next({ message: e.stack });

    if (e.toString().includes("別の名前を入力してください")) {
      res.status(409).send({
        result: "failed",
        message: "この動画の字幕は既に存在しています"
      });
      return;
    }

    res.sendStatus(500);
  }
});

router.post("/update", async function(req, res, next) {
  try {
    const sheetName = `${req.body.videoId},2`;
    await db.createSheet(sheetName);
    await db.writeToSheet(sheetName, req.body.items);

    slack.say(`<@${captionManager}> updateSheet:${sheetName}`);

    res.send({ result: "success" });
  } catch (e) {
    next({ message: e.stack });

    if (e.toString().includes("別の名前を入力してください")) {
      res.status(409).send({
        result: "failed",
        message: "この動画の字幕は既に存在しています"
      });
      return;
    }

    res.sendStatus(500);
  }
});

router.post("/get", async function(req, res, next) {
  try {
    const items = await db.getUploadedCaptionSpreadsheetContent(
      req.body.videoId
    );

    res.send({ items: items });
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

//計算誤差がある
router.post("/get/asr", async function(req, res, next) {
  try {
    const resultRow = await captionAsr.searchByVideoIdAndSec(
      req.body.videoId,
      req.body.sec
    );
    if (!resultRow) {
      res.sendStatus(404);
      return;
    }

    const nextRow = await captionAsr.searchByIdAndVideoId(
      resultRow.id + 1,
      req.body.videoId
    );
    if (nextRow) {
      const resultStart = Number(resultRow.start);
      const nextStart = Number(nextRow.start);
      if (resultStart + Number(resultRow.dur) > nextStart) {
        resultRow.dur = String(
          Math.floor((nextStart * 1000 - resultStart * 1000) / 1000)
        );
      }
    }

    res.send({ item: resultRow });
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

module.exports = router;
