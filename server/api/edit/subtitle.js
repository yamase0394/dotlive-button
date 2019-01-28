var express = require("express");
var router = express.Router();
const db = require(`${process.cwd()}/server/db/db`);
const slack = require(`${process.cwd()}/server/slackbot`);
require("dotenv").config();

const captionManager =
  process.env.NODE_ENV === "production"
    ? process.env.CAPTION_MANAGER_NAME
    : process.env.CAPTION_MANAGER_NAME_DEV;

router.post("/", async function(req, res, next) {
  try {
    const reqJson = req.body;
    let result = await db.createSheet(reqJson.videoId);
    if (result.result !== "success") {
      next({ message: result.message });
      res.status(404).send(result.message);
      return;
    }

    result = await db.writeToSheet(reqJson.videoId, reqJson.items);
    if (result.result !== "success") {
      next({ message: result.message });
      res.status(404).send(result.message);
      return;
    }

    slack.say(`<@${captionManager}> newSheet:${reqJson.videoId}`);

    res.send(result);
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

module.exports = router;
