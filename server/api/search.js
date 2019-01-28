var express = require("express");
var router = express.Router();

const ITEM_PER_PAGE = 100;

const db = require(`${process.cwd()}/server/db/db`);
const captionAsr = require(`../db/captionAsr`);

router.post("/button", async function(req, res, next) {
  try {
    let resJson;

    if (req.body.filter) {
      switch (req.body.filter.type) {
        case "channel": {
          const [
            resultCount,
            pageCount,
            subs
          ] = await db.searchSubtitleFromChannel(
            req.body.keyword,
            req.body.filter.id,
            req.body.page,
            ITEM_PER_PAGE
          );
          resJson = {
            resultCount: resultCount,
            pageCount: pageCount,
            items: subs
          };
          break;
        }
      }
    } else {
      const [resultCount, pageCount, subs] = await db.searchSubtitle(
        req.body.keyword,
        req.body.page,
        ITEM_PER_PAGE
      );
      resJson = {
        resultCount: resultCount,
        pageCount: pageCount,
        items: subs
      };
    }

    res.send(resJson);
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

router.post("/asr", async function(req, res, next) {
  try {
    let resJson;

    if (req.body.filter) {
      switch (req.body.filter.type) {
        case "channel": {
          const [
            resultCount,
            pageCount,
            subs
          ] = await captionAsr.seachByCaptionTextAndChannelId(
            req.body.keyword,
            req.body.filter.id,
            req.body.page,
            ITEM_PER_PAGE
          );
          resJson = {
            resultCount: resultCount,
            pageCount: pageCount,
            items: subs
          };
          break;
        }
      }
    } else {
      const [
        resultCount,
        pageNumber,
        subs
      ] = await captionAsr.seachByCaptionText(
        req.body.keyword,
        req.body.page,
        ITEM_PER_PAGE
      );
      resJson = {
        resultCount: resultCount,
        pageCount: pageNumber,
        items: subs
      };
    }

    res.send(resJson);
  } catch (e) {
    next({ message: e.stack });
    res.sendStatus(500);
  }
});

module.exports = router;
