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

const bot = slackbot.controller.spawn({ token: slackToken });

function start_rtm() {
  bot.startRTM(function(err, bot, payload) {
    if (err) {
      console.log("Failed to start RTM");
      return setTimeout(start_rtm, 60000);
    }
    console.log("RTM started!");
  });
}

slackbot.controller.on("rtm_close", function(bot, err) {
  start_rtm();
});

start_rtm();

slackbot.controller.hears("ping", "direct_mention", async function(
  bot,
  message
) {
  bot.reply(message, "pong");
});

slackbot.say = text => {
  bot.say({
    text: text,
    channel: channel
  });
};

module.exports = slackbot;
