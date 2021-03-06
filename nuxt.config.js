const pkg = require("./package");
const environment = process.env.NODE_ENV || "development";

module.exports = {
  mode: "spa",

  /*
   ** Headers of the page
   */
  head: {
    title: ".LIVE（どっとライブ）ボタン",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "google-site-verification",
        content: "_F8d3yO1Ps19OlqCK_Qbg7W1MqPbf5m9dL6xSU6R3uI"
      },
      { hid: "description", name: "description", content: pkg.description },
      {
        hid: "og:title",
        property: "og:title",
        content: ".LIVE（どっとライブ）ボタン"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: ".LIVE（どっとライブ）ボタン"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: pkg.description
      },
      {
        hid: "og:url",
        property: "og:url",
        content: "https://dotlivebutton.herokuapp.com/button"
      },
      { name: "twitter:card", content: "summary" }
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        href:
          "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons"
      },
      {
        rel: "stylesheet",
        href: "https://use.fontawesome.com/releases/v5.7.0/css/all.css"
      }
    ]
  },

  /*
   ** Customize the progress-bar color
   */
  loading: "~/components/loading.vue",

  loadingIndicator: {
    color: "#1976D2",
    name: "fading-circle",
    background: "#424242"
  },

  /*
   ** Global CSS
   */
  css: ["~/assets/style/app.styl"],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: ["@/plugins/vuetify", "~/plugins/axios"],

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
    [
      "@nuxtjs/axios",
      {
        baseURL:
          environment === "production"
            ? "https://dotlivebutton.herokuapp.com"
            : "http://localhost:3000"
      }
    ],
    ["@nuxtjs/dotenv", { only: ["aaa"] }],
    [
      "@nuxtjs/google-analytics",
      {
        id: "UA-53088406-3"
      }
    ],
    ["@nuxtjs/redirect-module", [{ from: "^/$", to: "/button" }]],
    ["portal-vue/nuxt"]
  ],
  /*
   ** Axios module configuration
   */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
  },

  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: "pre",
          test: /\.(js|vue)$/,
          loader: "eslint-loader",
          exclude: /(node_modules)/
        });
      }
    }
  },
  router: {
    scrollBehavior: function(to, from, savedPosition) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (savedPosition) {
            resolve(savedPosition);
          } else {
            resolve({ x: 0, y: 0 });
          }
        }, 500);
      });
    }
  },
  serverMiddleware: ["redirect-ssl"]
};
