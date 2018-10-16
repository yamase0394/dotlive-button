var express = require("express");
var router = express.Router();
const db = require(`${process.cwd()}/server/db/db`);

router.get("/:channelid", async function(req, res) {
  try {
    const data = await db.getChannelInfo(req.params.channelid);

    let resData = {
      url: data.thumbnails.default.url,
      channelName: data.title
    };

    res.send(resData);
  } catch (e) {
    console.log(e.toString());
    res.status(404).send("page not found");
  }
});

module.exports = router;
