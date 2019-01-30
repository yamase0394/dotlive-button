const { promisify } = require("util");
const { google } = require("googleapis");

const youtubeClinet = {};

const youtube = google.youtube({
  version: "v3",
  auth: process.env.youtubeApiKey
});

youtubeClinet.getChannelInfo = async channelId => {
  const res = await promisify(youtube.channels.list.bind(youtube))({
    part: "snippet",
    id: channelId
  }).catch(e => {
    throw new Error(JSON.stringify(e.errors));
  });

  return res.data.items;
};

module.exports = youtubeClinet;
