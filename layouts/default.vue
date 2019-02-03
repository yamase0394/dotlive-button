<template>
  <v-app dark>
    <v-navigation-drawer
      v-model="drawer"
      app
      class="drawer"
    >
      <v-list>
        <v-list-tile
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-tile-action>
            <v-icon v-html="item.icon" />
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title v-text="item.title" />
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      fixed
      flat
      app
      clipped-left
      height="50px"
      class="main-toolbar"
    >
      <v-toolbar-side-icon @click="drawer = !drawer" />
      <router-link
        v-if="!isMobile"
        class="clickable__toolbar-title"
        to="/button"
      >
        <v-toolbar-title v-text="title" />
      </router-link>
      <v-spacer v-if="!isMobile" />
      <v-text-field
        v-model="keyword"
        :class="[{'searchbox': !isMobile}, {'searchbox--mobile': isMobile}]"
        solo
        clearable
        color="blue darken-2"
        hide-details
        append-icon="search"
        @click:append="search"
        @keypress.enter.native="search"
      />
      <v-menu
        v-if="isMobile"
        bottm
        left
        offset-y
        :close-on-content-click="false"
      >
        <v-btn
          slot="activator"
          flat
          icon
        >
          <v-icon>tune</v-icon>
        </v-btn>
        <v-card>
          <v-list expand>
            <v-list-tile>
              <v-radio-group
                v-model="searchTarget"
                class="select-search-target-radio-group--mobile"
                row
              >
                <v-radio
                  color="blue darken-2"
                  value="button"
                  label="ボタン"
                />
                <v-radio
                  color="blue darken-2"
                  value="video"
                  label="動画"
                />
              </v-radio-group>
            </v-list-tile>
            <v-list-tile v-show="searchTarget === 'button'">
              <v-checkbox
                v-model="includesAsr"
                color="blue darken-2"
                label="自動生成された字幕"
                class="checkbox--include-asr--mobile"
              />
            </v-list-tile>
          </v-list>
        </v-card>
      </v-menu>
      <v-radio-group
        v-if="!isMobile"
        v-model="searchTarget"
        class="select-search-target-radio-group"
        row
      >
        <v-radio
          label="ボタン"
          color="blue darken-2"
          value="button"
        />
        <v-radio
          label="動画"
          color="blue darken-2"
          value="video"
        />
        <v-checkbox
          v-show="searchTarget === 'button'"
          v-model="includesAsr"
          label="自動生成された字幕"
          class="checkbox--include-asr"
          color="blue darken-2"
        />
      </v-radio-group>
      <v-spacer v-if="!isMobile" />
    </v-toolbar>
    <v-content>
      <v-container
        class="root-container"
        fluid
      >
        <nuxt-child />
      </v-container>
    </v-content>
    <v-footer />
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      fixed: false,
      items: [
        { icon: 'apps', title: 'ボタン', to: '/button' },
        { icon: 'local_movies', title: '動画', to: '/video/list' },
        { icon: "subtitles", title: "字幕作成", to: "/edit/caption" },
        { icon: "description", title: "このサイトについて", to: "/about" },
      ],
      title: '.LIVE ボタン',
      searching: false,
    }
  },
  computed: {
    searchPath() {
      return this.$store.getters["search/path"];
    },
    keyword: {
      get() {
        return this.$store.state.search.keyword;
      },
      set(val) {
        this.$store.commit("search/keyword", val);
      }
    },
    includesAsr: {
      get() {
        return this.$store.state.search.includesAsr;
      },
      set(val) {
        this.$store.commit("search/includesAsr", val);
      }
    },
    searchTarget: {
      get() {
        return this.$store.state.search.target;
      },
      set(val) {
        this.$store.commit("search/target", val);
      }
    },
    isMobile() {
      return ["xs", "sm"].some(e => {
        return this.$vuetify.breakpoint.name === e;
      });
    }
  },
  methods: {
    onToolbarTitleClicked() {
      this.$router.push("/button");
    },
    search() {
      if (this.searching) {
        return;
      }

      if (this.keyword) {
        this.$router.push({ path: this.searchPath });
        this.searching = true;
        setTimeout(() => { this.searching = false }, 500);
      }
    },
  },
}
</script>

<style>
.drawer {
  top: 50px;
  left: 0px;
}
.clickable__toolbar-title:hover {
  cursor: pointer;
}
.clickable__toolbar-title {
  min-width: 115px;
  color: #fff;
  text-decoration: none;
}
.searchbox {
  max-width: 500px;
}
.searchbox--mobile {
  max-width: 100%;
}
.searchbox.v-text-field.v-text-field--solo .v-input__control {
  min-height: 35px;
}
.searchbox--mobile.v-text-field.v-text-field--solo .v-input__control {
  min-height: 35px;
}
.checkbox--include-asr .v-messages {
  min-height: 0;
}
.checkbox--include-asr.v-input--selection-controls:not(.v-input--hide-details)
  .v-input__slot {
  margin-bottom: 0;
}
.checkbox--include-asr.v-input--selection-controls {
  padding-top: 0;
}
.select-search-target-radio-group {
  margin-left: 20px !important;
}
.select-search-target-radio-group .v-messages {
  min-height: 0;
}
.select-search-target-radio-group.v-input--selection-controls:not(.v-input--hide-details)
  .v-input__slot {
  margin-bottom: 0;
}
.select-search-target-radio-group.v-input--selection-controls {
  padding-top: 0;
}
.select-search-target-radio-group--mobile .v-input--selection-controls {
  margin-top: 0;
}
.select-search-target-radio-group--mobile .v-messages {
  min-height: 0;
}
.select-search-target-radio-group--mobile.v-input--selection-controls {
  margin-top: 5px;
}
.checkbox--include-asr--mobile {
  margin-top: 5px;
}
.checkbox--include-asr--mobile .v-messages {
  min-height: 0;
}
.root-container {
  padding: 0;
}
</style>
