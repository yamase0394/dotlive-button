var express = require("express");
var router = express.Router();
const slackbot = require("../../slackbot");
const AsyncLock = require("async-lock");
const captionAsr = require(`../../db/captionAsr`);

require("dotenv").config();

const SLACK_BOT_NAME =
  process.env.NODE_ENV === "production"
    ? process.env.CAPTION_MANAGER_NAME
    : process.env.CAPTION_MANAGER_NAME_DEV;
const SEND_INTERVAL = 15000;

const lock = new AsyncLock();
const countList = [];

router.post("/", async (req, res, next) => {
  try {
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
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

router.post("/asr", async (req, res, next) => {
  try {
    for (const item of req.body.items) {
      captionAsr.updateCount(item.id, item.count);
    }
    res.send({ result: "success" });
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

const sendCount = async () => {
  await lock
    .acquire("lock", () => {
      if (countList.length > 0) {
        slackbot.say(
          `<@${SLACK_BOT_NAME}> update count ${JSON.stringify(countList)}`
        );
        countList.length = 0;
      }
    })
    .catch(e => {
      slackbot.sendErrorToAdmin(e.stack);
    });

  setTimeout(sendCount, SEND_INTERVAL);
};
sendCount();

module.exports = router;
