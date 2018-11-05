const Botkit = require("botkit");
require("dotenv").config();

const slackbot = {};

let slackToken;
let channel;
if (process.env.NODE_ENV === "development") {
  slackToken = process.env.slackApiKeyDev;
  channel = "#dotlive_button_dev";
} else {
  slackToken = process.env.slackApiKey;
  channel = "#dotlive_button";
}

slackbot.controller = Botkit.slackbot({
  debug: false
});
slackbot.controller.hears("ping", "direct_mention", async function(
  bot,
  message
) {
  bot.reply(message, "pong");
});

const bot = slackbot.controller
  .spawn({ token: slackToken })
  .startRTM((err, bot, payload) => {
    if (err) {
      throw new Error(err);
    }
  });

slackbot.say = text => {
  bot.say({
    text: text,
    channel: channel
  });
};

module.exports = slackbot;
