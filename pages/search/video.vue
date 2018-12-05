<template>
  <v-container
    v-scroll="onScroll"
    grid-list-md
    fluid
    class="video-list-container"
  >
    <caption-status-filter-help-dialog ref="captionFilterHelpDialog" />
    <v-fab-transition>
      <v-btn
        v-show="scrollToTopFab"
        color="blue darken-2"
        fab
        small
        fixed
        bottom
        right
        @click="scrollToTop"
      >
        <v-icon>keyboard_arrow_up</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-layout
      align-center
      column
    >
      <v-flex>
        <p class="grey--text">
          検索結果 : {{ resultCount }}件
        </p>
      </v-flex>
      <v-layout
        align-center
        row
      >
        <v-flex>
          <v-select
            v-model="filter.channel"
            :items="channelFilterItems"
            :menu-props="{ maxHeight: '80vh' }"
            label="チャンネル"
            @change="onChannelFilterChanged"
          />
        </v-flex>
        <v-flex>
          <v-select
            v-model="filter.caption"
            :items="captionFilterItems"
            :menu-props="{ maxHeight: '80vh' }"
            label="字幕"
            @change="onCaptionFilterChanged"
          />
        </v-flex>
        <v-btn
          icon
          small
          @click="openCaptionFilterHelpDialog"
        >
          <v-icon>help_outline</v-icon>
        </v-btn>
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
          :caption-status="item[6]"
        />
      </v-flex>
    </v-layout>
    <infinite-loading
      ref="infiniteLoading"
      :identifier="infiniteId"
      spinner="spiral"
      @infinite="infiniteHandler"
    >
      <span slot="no-results" />
      <span slot="no-more" />
    </infinite-loading>
  </v-container>
</template>

<script>
import VideoCard from '~/components/VideoCard.vue'
import CaptionStatusFilterHelpDialog from '~/components/CaptionStatusFilterHelpDialog.vue'
import axios from "axios"
import InfiniteLoading from 'vue-infinite-loading';

const ITEM_PER_PAGE = 20;
const SESSION_STORAGE_CHANNEL_FILTER = "searchVideoPreChannelFilter";
const SESSION_STORAGE_CAPTION_FILTER = "videoListPreCaptionFilter";
const SESSION_STORAGE_DISPLAY_ITEMS = "searchVideoPreDisplayItems";
const SESSION_STORAGE_KEYWORD = "searchVideoKeyword";
const SESSION_STORAGE_VIDEO_DATA_VERSION = "videoDataVersion";
const SESSION_STORAGE_VIDEO_DATA = "videoData";

export default {
  components: {
    InfiniteLoading,
    VideoCard,
    CaptionStatusFilterHelpDialog
  },
  data() {
    return {
      items: [],
      filteredItems: [],
      displayItems: [],
      filter: null,
      channelNameToId: {},
      channelIdToName: {},
      channelFilterItems: [],
      captionFilterItems: null,
      captionStatusToFilterItems: null,
      captionFilterItemToStatus: null,
      resultCount: 0,
      scrollToTopFab: false,
      infiniteId: 0
    }
  },
  async asyncData({ params, query, error }) {
    console.log("asyncData");

    const items = await axios.post("/api/video", {
      type: "all",
      version: sessionStorage.getItem(SESSION_STORAGE_VIDEO_DATA_VERSION)
    }).then(res => {
      if (res.status === 204) {
        return JSON.parse(sessionStorage.getItem(SESSION_STORAGE_VIDEO_DATA));
      }

      sessionStorage.setItem(SESSION_STORAGE_VIDEO_DATA_VERSION, res.data.version);
      sessionStorage.setItem(SESSION_STORAGE_VIDEO_DATA, JSON.stringify(res.data.items));

      return res.data.items;
    }).catch(e => {
      error({ statusCode: 404, message: 'Page not found' });
    });

    const channelIds = await axios.get("/api/channel/list").then(res => {
      return res.data.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });

    const channelNameToId = {};
    const channelIdToName = {};
    const filter = { channel: "すべて", caption: "あり" };
    let filteredItems = items;
    for (let channelId of channelIds) {
      const res = await axios.get(`/api/channel/${channelId}`).catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });
      channelNameToId[res.data.channelName] = channelId;
      channelIdToName[channelId] = res.data.channelName;
    }

    if (channelIdToName[query.channel]) {
      filter.channel = channelIdToName[query.channel];
      filteredItems = filteredItems.filter(e => e[0] === query.channel);
    }

    const captionStatusToFilterItems = {
      "uploaded,dotlive_button": "あり",
      "dotlive_button": "どっとライブボタン限定",
      "can_upload": "アップロード可能",
      "editable": "編集可",
      "not_permitted": "編集不可",
      "waiting_ack": "審査待ち",
      "checking": "確認中"
    };
    if (captionStatusToFilterItems[query.caption]) {
      filter.caption = captionStatusToFilterItems[query.caption];
      const split = query.caption.split(",");
      filteredItems = filteredItems.filter(e => split.some(cond => cond === e[6]));
    } else {
      filteredItems = filteredItems.filter(e => e[6] === "uploaded" || e[6] === "dotlive_button");
    }

    if (query.keyword) {
      const searchRegs = query.keyword.split(/\s+/).map(str => new RegExp(str, "i"));
      filteredItems = filteredItems.filter(e => searchRegs.every(reg => reg.test(e[3]) || reg.test[4]));
      sessionStorage.setItem(SESSION_STORAGE_KEYWORD, query.keyword);
    } else {
      filteredItems = [];
      sessionStorage.removeItem(SESSION_STORAGE_KEYWORD)
    }

    const captionFilterItemToStatus = {};
    Object.keys(captionStatusToFilterItems).forEach(key => {
      captionFilterItemToStatus[captionStatusToFilterItems[key]] = key;
    });
    let displayItems;
    if (sessionStorage.getItem(SESSION_STORAGE_DISPLAY_ITEMS) &&
      (query.channel === sessionStorage.getItem(SESSION_STORAGE_CHANNEL_FILTER) ||
        !query.channel && !sessionStorage.getItem(SESSION_STORAGE_CHANNEL_FILTER)) &&
      query.keyword === sessionStorage.getItem(SESSION_STORAGE_KEYWORD) &&
      (query.caption === sessionStorage.getItem(SESSION_STORAGE_CAPTION_FILTER) ||
        !query.caption && !sessionStorage.getItem(SESSION_STORAGE_CAPTION_FILTER))) {
      console.log("hit cache");
      displayItems = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_DISPLAY_ITEMS));
    } else {
      console.log("no cache");
      displayItems = filteredItems.slice(0, Math.min(ITEM_PER_PAGE, filteredItems.length));

      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS, JSON.stringify(displayItems));

      if (channelNameToId[filter.channel]) {
        sessionStorage.setItem(SESSION_STORAGE_CHANNEL_FILTER, channelNameToId[filter.channel]);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CHANNEL_FILTER);
      }

      if (channelNameToId[filter.caption]) {
        sessionStorage.setItem(SESSION_STORAGE_CAPTION_FILTER, captionFilterItemToStatus[filter.caption]);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CAPTION_FILTER);
      }
    }

    return {
      items: items,
      filteredItems: filteredItems,
      displayItems: displayItems,
      channelNameToId: channelNameToId,
      channelIdToName: channelIdToName,
      channelFilterItems: ["すべて", ...Object.keys(channelNameToId)],
      filter: filter,
      resultCount: filteredItems.length,
      captionStatusToFilterItems: captionStatusToFilterItems,
      captionFilterItemToStatus: captionFilterItemToStatus,
      captionFilterItems: Object.keys(captionFilterItemToStatus)
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

      if (this.captionStatusToFilterItems[to.query.caption]) {
        sessionStorage.setItem(SESSION_STORAGE_CAPTION_FILTER, to.query.caption);
        this.filter.caption = this.captionStatusToFilterItems[to.query.caption];
        const split = to.query.caption.split(",");
        temp = temp.filter(e => split.some(cond => cond === e[6]));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CAPTION_FILTER);
        this.filter.caption = "あり";
        temp = temp.filter(e => e[6] === "uploaded" || e[6] === "dotlive_button");
      }

      this.infiniteId++;
      this.filteredItems = temp;
      this.resultCount = this.filteredItems.length;
      this.displayItems = this.filteredItems.slice(0, Math.min(ITEM_PER_PAGE, this.filteredItems.length));
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
        this.$router.push({ query: { keyword: this.$route.query.keyword, channel: this.channelNameToId[value], caption: this.$route.query.caption } });
      }

      this.infiniteId++;
    },
    onCaptionFilterChanged(val) {
      if (this.$route.query.caption !== this.captionFilterItemToStatus[val]) {
        console.log(`caption filter changed:${val}`);
        this.$router.push({ query: { keyword: this.$route.query.keyword, channel: this.$route.query.channel, caption: this.captionFilterItemToStatus[val] } });
      }

      this.infiniteId++;
    },
    infiniteHandler($state) {
      if (this.filteredItems.length === this.displayItems.length) {
        $state.complete();
        return;
      }

      setTimeout(() => {
        const temp = [];
        for (let i = this.displayItems.length; i < Math.min(this.displayItems.length + ITEM_PER_PAGE, this.filteredItems.length); i++) {
          temp.push(this.filteredItems[i]);
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
    },
    openCaptionFilterHelpDialog() {
      this.$refs.captionFilterHelpDialog.open();
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
