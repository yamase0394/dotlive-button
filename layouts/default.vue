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
          :to="item.to"
          :key="i"
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
    >
      <v-toolbar-side-icon @click="drawer = !drawer" />
      <router-link
        class="clickable__toolbar-title"
        to="/button"
      >
        <v-toolbar-title v-text="title" />
      </router-link>
      <v-spacer />
      <v-text-field
        v-model="keyword"
        solo
        class="searchbox"
        clearable
        hide-details
        append-icon="search"
        @click:append="search"
        @keypress.enter.native="search"
      />
      <v-radio-group
        v-model="searchTarget"
        class="radio--choose-target"
        row
      >
        <v-radio
          label="ボタン"
          color="#1976d2"
          value="button"
        />
        <v-radio
          label="動画"
          color="#1976d2"
          value="video"
        />
      </v-radio-group>
      <v-checkbox
        v-show="searchTarget === 'button'"
        v-model="includesAsr"
        label="自動生成された字幕"
        class="checkbox--include-asr"
        color="#1976d2"
      />
      <v-spacer />
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
      searching: false
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
    }
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
.searchbox.v-text-field.v-text-field--solo .v-input__control {
  max-width: 400px;
  width: 400px;
  min-height: 35px;
}
.searchbox .v-input__control .v-input__slot {
  margin-bottom: 0;
}
.v-toolbar__content .v-input {
  flex-grow: 0 !important;
}
.checkbox--include-asr {
  margin-left: 12px !important;
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
.radio--choose-target {
  margin-left: 20px !important;
}
.radio--choose-target .v-messages {
  min-height: 0;
}
.radio--choose-target.v-input--selection-controls:not(.v-input--hide-details)
  .v-input__slot {
  margin-bottom: 0;
}
.radio--choose-target.v-input--selection-controls {
  padding-top: 0;
}
.root-container {
  padding: 0;
}
</style>
