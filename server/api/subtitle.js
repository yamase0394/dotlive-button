var express = require("express");
var router = express.Router();

const ITEM_PER_PAGE = 100;
const RANDOM_ITEM_COUNT = 100;

const db = require(`${process.cwd()}/server/db/db`);
const captionAsr = require(`../db/captionAsr`);

router.post("/", async function(req, res, next) {
  try {
    let resJson;
    switch (req.body.type) {
      case "all":
        const [pageCount, sliced] = await db.getSubtitleRange(
          req.body.page,
          ITEM_PER_PAGE
        );
        resJson = {
          pageCount: pageCount,
          items: sliced
        };
        break;
      case "video":
        let subsFilteredByVideoId = await db.getSubtitleByVideoId(req.body.id);
        if (subsFilteredByVideoId.length === 0) {
          subsFilteredByVideoId = await captionAsr.seachByVideoId(req.body.id);
        }
        resJson = { items: subsFilteredByVideoId };
        break;
      case "channel":
        const [
          pageCountFilterByChannId,
          subsFilteredByChannId
        ] = await db.getSubtitleRangeByChannelId(
          req.body.id,
          req.body.page,
          ITEM_PER_PAGE
        );
        resJson = {
          pageCount: pageCountFilterByChannId,
          items: subsFilteredByChannId
        };

        break;
      case "random":
        const randomSubs = await db.getRandomSubtitles(RANDOM_ITEM_COUNT);
        resJson = { items: randomSubs };
        break;
    }

    res.send(resJson);
  } catch (e) {
    console.log(e.toString());
    res.status(404).send("page not found");
  }
});

router.get("/channel", async (req, res, next) => {
  try {
    const items = await db.getChannelContainsSubtitle();

    res.send({ items: items });
  } catch (e) {
    console.log(e.toString());
    res.status(404).send("page not found");
  }
});

module.exports = router;
