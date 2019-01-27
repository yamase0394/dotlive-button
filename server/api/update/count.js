var express = require("express");
var router = express.Router();
const slack = require(`${process.cwd()}/server/slackbot`);
const AsyncLock = require("async-lock");
const captionAsr = require(`../../db/captionAsr`);

require("dotenv").config();

const SLACK_BOT_NAME =
  process.env.NODE_ENV === "production"
    ? process.env.CAPTION_MANAGER_NAME
    : process.env.CAPTION_MANAGER_NAME_DEV;
const SEND_INTERVAL = 10000;

const lock = new AsyncLock();
const countList = [];

router.post("/", async (req, res) => {
  try {
    console.log("hoge");
    await lock.acquire("lock", () => {
      for (const item of req.body.items) {
        const existing = countList.find(
          e =>
            item.start === e.start &&
            item.end === e.end &&
            item.text === e.text &&
            item.videoId === e.videoId
        );

        if (existing) {
          existing.count += item.count;
        } else {
          countList.push(item);
        }
      }
    });

    res.send({ result: "success" });
  } catch (e) {
    console.log(e);
    res.status(404).send("unknown error");
  }
});

router.post("/asr", async (req, res) => {
  try {
    for (const item of req.body.items) {
      captionAsr.updateCount(item.id, item.count);
    }
    res.send({ result: "success" });
  } catch (e) {
    console.log(e);
    res.status(404).send("unknown error");
  }
});

const sendCount = async () => {
  await lock.acquire("lock", () => {
    if (countList.length > 0) {
      slack.say(
        `<@${SLACK_BOT_NAME}> update count ${JSON.stringify(countList)}`
      );
      countList.length = 0;
    }
  });
  setTimeout(sendCount, SEND_INTERVAL);
};
sendCount();

module.exports = router;
