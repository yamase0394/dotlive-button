<template>
  <v-container
    v-scroll="onScroll"
    grid-list-md
    fluid
    class="video-list-container">
    <caption-status-filter-help-dialog ref="captionFilterHelpDialog"/>
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
      <v-layout align-center>
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
          @click="openCaptionFilterHelpDialog">
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
      spinner="spiral"
      @infinite="infiniteHandler">
      <span slot="no-results"/>
      <span slot="no-more"/>
    </infinite-loading>
  </v-container>
</template>

<script>
import VideoCard from '~/components/VideoCard.vue'
import CaptionStatusFilterHelpDialog from '~/components/CaptionStatusFilterHelpDialog.vue'
import axios from "axios"
import InfiniteLoading from 'vue-infinite-loading';

const ITEM_PER_PAGE = 20;
const SESSION_STORAGE_CHANNEL_FILTER = "videoListPreChannelFilter";
const SESSION_STORAGE_CAPTION_FILTER = "videoListPreCaptionFilter";
const SESSION_STORAGE_DISPLAY_ITEMS = "videoListPreDisplayItems";
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
      scrollToTopFab: false,
    }
  },
  async asyncData({ query }) {
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
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
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
      filter.caption = "あり";
      filteredItems = filteredItems.filter(e => e[6] === "uploaded" || e[6] === "dotlive_button");
    }

    const captionFilterItemToStatus = {};
    Object.keys(captionStatusToFilterItems).forEach(key => {
      captionFilterItemToStatus[captionStatusToFilterItems[key]] = key;
    });
    let displayItems;
    if (sessionStorage.getItem(SESSION_STORAGE_DISPLAY_ITEMS) &&
      (query.channel === sessionStorage.getItem(SESSION_STORAGE_CHANNEL_FILTER) ||
        !query.channel && !sessionStorage.getItem(SESSION_STORAGE_CHANNEL_FILTER)) &&
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
    '$route': async function (to, from) {
      console.log("route");
      if (this.channelIdToName[to.query.channel]) {
        sessionStorage.setItem(SESSION_STORAGE_CHANNEL_FILTER, to.query.channel);
        this.filter.channel = this.channelIdToName[to.query.channel];
        this.filteredItems = this.items.filter(e => e[0] === to.query.channel);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CHANNEL_FILTER);
        this.filter.channel = "すべて";
        this.filteredItems = this.items;
      }

      if (this.captionStatusToFilterItems[to.query.caption]) {
        sessionStorage.setItem(SESSION_STORAGE_CAPTION_FILTER, to.query.caption);
        this.filter.caption = this.captionStatusToFilterItems[to.query.caption];
        const split = to.query.caption.split(",");
        this.filteredItems = this.filteredItems.filter(e => split.some(cond => cond === e[6]));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CAPTION_FILTER);
        this.filter.caption = "あり";
        this.filteredItems = this.filteredItems.filter(e => e[6] === "uploaded" || e[6] === "dotlive_button");
      }

      this.$refs.infiniteLoading.$emit("$InfiniteLoading:reset");
      this.displayItems = this.filteredItems.slice(0, Math.min(ITEM_PER_PAGE, this.filteredItems.length));
      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS, JSON.stringify(this.displayItems));
    }
  },
  created() {
    this.$emit("searchTargetChangedEvent", "video");
  },
  methods: {
    onChannelFilterChanged(value) {
      //ブラウザの進むor戻るでない
      if (this.$route.query.channel !== this.channelNameToId[value]) {
        console.log(`channel filter changed:${value}`);
        this.$router.push({ query: { channel: this.channelNameToId[value], caption: this.$route.query.caption } });
      }
    },
    onCaptionFilterChanged(val) {
      if (this.$route.query.caption !== this.captionFilterItemToStatus[val]) {
        console.log(`caption filter changed:${val}`);
        this.$router.push({ query: { channel: this.$route.query.channel, caption: this.captionFilterItemToStatus[val] } });
      }

      this.$refs.infiniteLoading.$emit("$InfiniteLoading:reset");
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
  margin: 20px 0 15px 0;
  padding: 0;
}
</style>
