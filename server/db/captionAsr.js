require("dotenv").config();

const { Client } = require("pg");
const format = require("pg-format");

const client =
  process.env.NODE_ENV === "production"
    ? new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: true
      })
    : new Client({
        user: process.env.POSTGRES_USER_DEV,
        host: process.env.POSTGRES_HOST_DEV,
        database: process.env.POSTGRES_DATABASE_DEV,
        password: process.env.POSTGRES_PASSWORD_DEV,
        port: 5432
      });
client.connect();

const captionAsr = {};

captionAsr.seachByCaptionText = async (keyword, page, itemPerPage) => {
  if (!keyword) {
    return [0, 0, []];
  }

  const searchRegs = keyword
    .split(/\s+/)
    .map(str => format("text LIKE %L", `%${str}%`))
    .join(" AND ");
  const res = await client.query(
    `select start, dur, text, channel_id, video_id, id, count, count(id) over() as full_count from caption_asr where ${searchRegs} ORDER BY id ASC offset ${itemPerPage *
      (page - 1)} limit ${itemPerPage}`
  );

  const total = res.rowCount > 0 ? res.rows[0].full_count : 0;
  res.rows.forEach(e => delete e.full_count);
  const pageNumber = Math.ceil(total / itemPerPage);
  return [
    total,
    pageNumber,
    res.rows.map(e => {
      e.id = String(e.id);
      return Object.values(e);
    })
  ];
};

captionAsr.seachByCaptionTextAndChannelId = async (
  keyword,
  channelId,
  page,
  itemPerPage
) => {
  if (!keyword) {
    return [0, 0, []];
  }

  const searchRegs = keyword
    .split(/\s+/)
    .map(str => format("text LIKE %L", `%${str}%`))
    .join(" AND ");
  const res = await client.query(
    format(
      `select start, dur, text, channel_id, video_id, id, count, count(id) over() as full_count from caption_asr where channel_id = %L AND ${searchRegs} ORDER BY id ASC offset %L limit %L`,
      channelId,
      itemPerPage * (page - 1),
      itemPerPage
    )
  );

  const total = res.rowCount > 0 ? res.rows[0].full_count : 0;
  res.rows.forEach(e => delete e.full_count);
  const pageNumber = Math.ceil(total / itemPerPage);
  return [
    total,
    pageNumber,
    res.rows.map(e => {
      e.id = String(e.id);
      return Object.values(e);
    })
  ];
};

captionAsr.seachByVideoId = async videoId => {
  const res = await client.query(
    format(
      `select start, dur, text, channel_id, video_id, id, count from caption_asr where video_id = %L ORDER BY id ASC`,
      videoId
    )
  );

  return res.rows.map(e => {
    e.id = String(e.id);
    return Object.values(e);
  });
};

captionAsr.updateCount = async (id, count) => {
  const query = {
    name: "update-count",
    text: "UPDATE caption_asr SET count = count + $1 WHERE id = $2",
    values: [count, id]
  };
  return await client.query(query);
};

module.exports = captionAsr;
