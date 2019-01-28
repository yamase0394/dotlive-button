var express = require("express");
var router = express.Router();
const db = require(`${process.cwd()}/server/db/db`);

router.get("/list", async function(req, res, next) {
  try {
    const items = [];
    const channelList = await db.getChannelList();
    for (const channelId of channelList) {
      const channelInfo = await db.getChannelInfo(channelId);
      items.push({
        url: channelInfo.thumbnails.default.url,
        channelName: channelInfo.title,
        id: channelId
      });
    }

    res.send({ items: items });
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

module.exports = router;
