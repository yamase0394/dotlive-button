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
        to="/button">
        <v-toolbar-title
          v-text="title"/>
      </router-link>
      <v-layout
        align-center
        column>
        <v-flex xs12>
          <v-text-field
            v-model="searchText"
            solo
            class="searchbox"
            clearable
            hide-details
            append-icon="search"
            @click:append="search"
            @keypress.enter.native="search"
          />
        </v-flex>
      </v-layout>
    </v-toolbar>
    <v-content>
      <v-container
        class="root-container"
        fluid>
        <nuxt-child
          ref="child"
          @searchTextChangedEvent="onSearchTextChangedAtChild"
          @searchTargetChangedEvent="onSearchTargetChanged"
        />
      </v-container>
    </v-content>
    <v-footer/>
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
      searchText: "",
      searching: false,
      searchTarget: "button",
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

      if (this.searchText) {
        this.$router.push({ path: `/search/${this.searchTarget}?keyword=${this.searchText}` });
        this.searching = true;
        setTimeout(() => { this.searching = false }, 500);
      }
    },
    onSearchTextChangedAtChild(newText) {
      this.searchText = newText;
    },
    onSearchTargetChanged(target) {
      this.searchTarget = target;
    }
  }
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
.root-container {
  padding: 0;
}
</style>
