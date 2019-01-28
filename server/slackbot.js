const Botkit = require("botkit");
require("dotenv").config();

const slackbot = {};

const channel =
  process.env.NODE_ENV === "production"
    ? "#dotlive_button"
    : "#dotlive_button_dev";
const slackToken =
  process.env.NODE_ENV === "production"
    ? process.env.slackApiKey
    : process.env.slackApiKeyDev;
const ADMIN_INCOMING_WEBHOOK_URL =
  process.env.NODE_ENV === "production"
    ? process.env.SLACK_ADMIN_INCOMING_WEBHOOK_URL
    : process.env.SLACK_ADMIN_INCOMING_WEBHOOK_URL_DEV;

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

slackbot.sendMessageToAdmin = message => {
  bot.configureIncomingWebhook({
    url: ADMIN_INCOMING_WEBHOOK_URL
  });
  bot.sendWebhook({ text: message });
};

slackbot.sendErrorToAdmin = message => {
  bot.configureIncomingWebhook({
    url: ADMIN_INCOMING_WEBHOOK_URL
  });
  bot.sendWebhook({
    text: "Error",
    attachments: [
      {
        color: "#D00000",
        text: "```" + message + "```"
      }
    ]
  });
};

module.exports = slackbot;
