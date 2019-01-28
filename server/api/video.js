var express = require("express");
var router = express.Router();
const db = require(`${process.cwd()}/server/db/db`);

router.post("/", async function(req, res, next) {
  try {
    const reqJson = req.body;

    const version = await db.getVersion("video");
    if (reqJson.hasOwnProperty("version") && reqJson.version === version) {
      res.sendStatus(204);
      return;
    }

    let data;
    switch (reqJson.type) {
      case "video":
        data = await db.getVideoInfoByVideoId(reqJson.id);
        break;
      case "channel":
        data = await db.getVideoInfoByChannelId(reqJson.id);
        break;
      case "all":
        data = await db.getVideoInfos();
        break;
      default:
        res.status(404).send("unknown error");
        return;
    }
    res.send({ items: data, version: version });
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

module.exports = router;
