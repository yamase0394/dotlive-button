<template>
  <v-container
    v-scroll="onScroll"
    grid-list-md
    fluid
    class="video-list-container">
    <v-fab-transition>
      <v-btn
        v-show="scrollToTopFab"
        color="blue darken-2"
        fab
        small
        fixed
        bottom
        right
        @click="scrollToTop">
        <v-icon>keyboard_arrow_up</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-layout
      align-center
      column>
      <v-flex>
        <p class="grey--text">
          検索結果 : {{ resultCount }}件
        </p>
      </v-flex>
      <v-layout
        row>
        <v-flex>
          <v-select
            v-model="filter.channel"
            :items="channelFilterItems"
            @change="onChannelFilterChanged"
          />
        </v-flex>
      </v-layout>
      <v-flex
        v-for="item in displayItems"
        :key="item[1]"
      >
        <video-card
          :title="item[3]"
          :published-at="new Date(item[2]).toLocaleString()"
          :description="item[4]"
          :thumbnail="item[5]"
          :video-id="item[1]"
        />
      </v-flex>
    </v-layout>
    <infinite-loading
      ref="infiniteLoading"
      spinner="spiral"
      @infinite="infiniteHandler">
      <span slot="no-results"/>
      <span slot="no-more"/>
    </infinite-loading>
  </v-container>
</template>

<script>
import VideoCard from '~/components/VideoCard.vue'
import axios from "axios"
import InfiniteLoading from 'vue-infinite-loading';

const ITEM_PER_PAGE = 20;
const SESSION_STORAGE_CHANNEL_FILTER = "searchVideoPreChannelFilter";
const SESSION_STORAGE_DISPLAY_ITEMS = "searchVideoPreDisplayItems";
const SESSION_STORAGE_KEYWORD = "searchVideoKeyword";
const LOCAL_STORAGE_VIDEO_DATA_VERSION = "videoDataVersion";
const LOCAL_STORAGE_VIDEO_DATA = "videoData";

export default {
  components: {
    InfiniteLoading,
    VideoCard
  },
  data() {
    return {
      items: [],
      fliteredItems: [],
      displayItems: [],
      filter: null,
      channelNameToId: {},
      channelIdToName: {},
      channelFilterItems: [],
      resultCount: 0,
      scrollToTopFab: false
    }
  },
  async asyncData({ params, query, error }) {
    console.log("asyncData");

    const items = await axios.post("/api/video", {
      type: "all",
      version: localStorage.getItem(LOCAL_STORAGE_VIDEO_DATA_VERSION)
    }).then(res => {
      if (res.status === 204) {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_VIDEO_DATA));
      }

      localStorage.setItem(LOCAL_STORAGE_VIDEO_DATA_VERSION, res.data.version);
      localStorage.setItem(LOCAL_STORAGE_VIDEO_DATA, JSON.stringify(res.data.items));

      return res.data.items;
    }).catch(e => {
      error({ statusCode: 404, message: 'Page not found' });
    });

    const channelIds = await axios.get("/api/subtitle/channel").then(res => {
      return res.data.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });

    const channelNameToId = {};
    const channelIdToName = {};
    const filter = { channel: "すべて" };
    let fliteredItems = items;
    for (let channelId of channelIds) {
      const res = await axios.get(`/api/channel/${channelId}`).catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });
      channelNameToId[res.data.channelName] = channelId;
      channelIdToName[channelId] = res.data.channelName;
    }

    if (channelIdToName[query.channel]) {
      filter.channel = channelIdToName[query.channel];
      fliteredItems = items.filter(e => e[0] === query.channel);
    }

    if (query.keyword) {
      const searchRegs = query.keyword.split(/\s+/).map(str => new RegExp(str, "i"));
      fliteredItems = fliteredItems.filter(e => searchRegs.every(reg => reg.test(e[3]) || reg.test[4]));
      sessionStorage.setItem(SESSION_STORAGE_KEYWORD, query.keyword);
    } else {
      fliteredItems = [];
      sessionStorage.removeItem(SESSION_STORAGE_KEYWORD)
    }

    let displayItems = fliteredItems.slice(0, Math.min(ITEM_PER_PAGE, fliteredItems.length));
    if (sessionStorage.getItem(SESSION_STORAGE_DISPLAY_ITEMS) &&
      query.channel == sessionStorage.getItem(SESSION_STORAGE_CHANNEL_FILTER) &&
      sessionStorage.getItem(SESSION_STORAGE_KEYWORD) &&
      query.keyword == sessionStorage.getItem(SESSION_STORAGE_KEYWORD)) {
      console.log("hit cache");
      displayItems = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_DISPLAY_ITEMS));
    } else {
      console.log("no cache");
      displayItems = fliteredItems.slice(0, Math.min(ITEM_PER_PAGE, fliteredItems.length));
      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS, JSON.stringify(displayItems));
      if (channelNameToId[filter.channel]) {
        sessionStorage.setItem(SESSION_STORAGE_CHANNEL_FILTER, channelNameToId[filter.channel]);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CHANNEL_FILTER);
      }
    }

    return {
      items: items,
      fliteredItems: fliteredItems,
      displayItems: displayItems,
      channelNameToId: channelNameToId,
      channelIdToName: channelIdToName,
      channelFilterItems: ["すべて", ...Object.keys(channelNameToId)],
      filter: filter,
      resultCount: fliteredItems.length
    }
  },
  watch: {
    "$route": async function (to, from) {
      console.log("route");

      let temp = this.items;

      if (to.query.keyword) {
        const searchRegs = to.query.keyword.split(/\s+/).map(str => new RegExp(str, "i"));
        temp = temp.filter(e => searchRegs.every(reg =>
          reg.test(e[3]) || reg.test[4]
        ));
        sessionStorage.setItem(SESSION_STORAGE_KEYWORD, to.query.keyword);
      } else {
        temp = [];
        sessionStorage.removeItem(SESSION_STORAGE_KEYWORD);
      }

      if (this.channelIdToName[to.query.channel]) {
        this.filter.channel = this.channelIdToName[to.query.channel];
        temp = temp.filter(e => to.query.channel === e[0]);
        sessionStorage.setItem(SESSION_STORAGE_CHANNEL_FILTER, to.query.channel);
      } else {
        this.filter.channel = "すべて";
        sessionStorage.removeItem(SESSION_STORAGE_CHANNEL_FILTER);
      }

      this.$refs.infiniteLoading.$emit("$InfiniteLoading:reset");
      this.fliteredItems = temp;
      this.resultCount = this.fliteredItems.length;
      this.displayItems = this.fliteredItems.slice(0, Math.min(ITEM_PER_PAGE, this.fliteredItems.length));
      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS, JSON.stringify(this.displayItems));

      // this.$nextTick(() => {
      //   this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
      // });
    }
  },
  async created() {
    this.$emit("searchTargetChangedEvent", "video");
    this.$emit("searchTextChangedEvent", this.$route.query.keyword);
    this.noticeQueryUpdateToParent();
  },
  methods: {
    onChannelFilterChanged(value) {
      //ブラウザの進むor戻るでない
      if (this.$route.query.channel !== this.channelNameToId[value]) {
        console.log(`channel filter changed:${value}`);
        this.$router.push({ query: { keyword: this.$route.query.keyword, channel: this.channelNameToId[value] } });
      }

      this.$refs.infiniteLoading.$emit("$InfiniteLoading:reset");
    },
    infiniteHandler($state) {
      if (this.fliteredItems.length === this.displayItems.length) {
        $state.complete();
        return;
      }

      setTimeout(() => {
        const temp = [];
        for (let i = this.displayItems.length; i < Math.min(this.displayItems.length + ITEM_PER_PAGE, this.fliteredItems.length); i++) {
          temp.push(this.fliteredItems[i]);
        }
        this.displayItems = this.displayItems.concat(temp);
        sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS, JSON.stringify(this.displayItems));
        $state.loaded();
      }, 600);
    },
    noticeQueryUpdateToParent() {
      this.$emit("keywordChangedEvent", this.$route.query.keyword);
    },
    onScroll(e) {
      if (typeof window === 'undefined') return;

      const top = window.pageYOffset || e.target.scrollTop || 0;
      this.scrollToTopFab = top > 20;
    },
    scrollToTop() {
      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
      });
      this.scrollToTopFab = false;
    }
  },
}
</script>

<style>
.video-list-container {
  padding: 30px 0 15px 0;
  margin: 0;
}
</style>
