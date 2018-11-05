var express = require("express");
var router = express.Router();

const db = require(`${process.cwd()}/server/db/db`);
const slack = require(`${process.cwd()}/server/slackbot`);

router.post("/", async function(req, res) {
  try {
    const reqJson = req.body;
    let result = await db.createSheet(reqJson.videoId);
    if (result.result !== "success") {
      console.log(result);
      res.status(404).send(result.message);
      return;
    }

    result = await db.writeToSheet(reqJson.videoId, reqJson.items);
    if (result.result !== "success") {
      console.log(result);
      res.status(404).send(result.message);
      return;
    }

    slack.say(`<@saku-tama> newSheet:${reqJson.videoId}`);

    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(404).send("unknown error");
  }
});

module.exports = router;
