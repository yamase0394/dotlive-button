const express = require("express");
const consola = require("consola");
const { Nuxt, Builder } = require("nuxt");
const slackbot = require("./slackbot");

const app = express();
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3000;

app.set("port", port);

// Import and Set Nuxt.js options
let config = require("../nuxt.config.js");
config.dev = !(process.env.NODE_ENV === "production");
// require("dotenv").config();

//user edited
app.use(express.json());
app.use("/api/subtitle", require("./api/subtitle"));
app.use("/api/video", require("./api/video"));
app.use("/api/channel", require("./api/channel"));
app.use("/api/search", require("./api/search"));
app.use("/api/edit/subtitle", require("./api/edit/subtitle"));
app.use("/api/update/count", require("./api/update/count"));

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config);

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  }

  // Give nuxt middleware to express
  app.use(nuxt.render);

  app.use(function(err, req, res, next) {
    slackbot.sendErrorToAdmin(err.message);
  });

  // Listen the server
  app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  });
}
start();
