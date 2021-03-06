<template>
  <div v-scroll="onScroll">
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
      pt-3
    >
      <v-layout
        align-center
        justify-center
        px-3
      >
        <v-flex md5>
          <v-select
            v-model="filter.channel"
            :class="[{'video-filter':!isMobile}, {'video-filter--mobile':isMobile}]"
            :items="channelFilterItems"
            :menu-props="{ maxHeight: '70vh' }"
            label="チャンネル"
            @change="onChannelFilterChanged"
          />
        </v-flex>
        <v-flex md5>
          <v-select
            v-model="filter.caption"
            :class="[{'video-filter':!isMobile}, {'video-filter--mobile':isMobile}]"
            :items="captionFilterItems"
            :menu-props="{ maxHeight: '70vh' }"
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
      <video-card
        v-for="item in displayItems"
        :key="item[1]"
        class="my-1"
        :class="[{'video-card':!isMobile}, {'video-card--mobile':isMobile}]"
        :title="item[3]"
        :published-at="new Date(item[2]).toLocaleString()"
        :description="item[4]"
        :thumbnail="item[5]"
        :video-id="item[1]"
        :caption-status="item[6]"
      />
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
  </div>
</template>

<script>
import VideoCard from '~/components/VideoCard.vue'
import CaptionStatusFilterHelpDialog from '~/components/CaptionStatusFilterHelpDialog.vue'
import InfiniteLoading from 'vue-infinite-loading';

const ITEM_PER_PAGE = 20;
const SESSION_STORAGE_CHANNEL_FILTER = "videoListPreChannelFilter";
const SESSION_STORAGE_CAPTION_FILTER = "videoListPreCaptionFilter";
const SESSION_STORAGE_DISPLAY_ITEMS = "videoListPreDisplayItems";
const SESSION_STORAGE_VIDEO_DATA_VERSION = "videoDataVersion";
const SESSION_STORAGE_VIDEO_DATA = "videoData";

const videoSheetColumn = {
  CHANNEL_ID: 0,
  VIDEO_ID: 1,
  PUBLISHED_AT: 2,
  TITLE: 3,
  DESCRIPTION: 4,
  THUM_URL: 5,
  STATUS: 6
};

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
      infiniteId: 0
    }
  },
  async asyncData({ query, $axios }) {
    console.log("asyncData");
    const items = await $axios.$post("/api/video", {
      type: "all",
      version: sessionStorage.getItem(SESSION_STORAGE_VIDEO_DATA_VERSION)
    }).then(res => {
      if (res.status === 204) {
        return JSON.parse(sessionStorage.getItem(SESSION_STORAGE_VIDEO_DATA));
      }

      sessionStorage.setItem(SESSION_STORAGE_VIDEO_DATA_VERSION, res.version);
      sessionStorage.setItem(SESSION_STORAGE_VIDEO_DATA, JSON.stringify(res.items));
      sessionStorage.removeItem(SESSION_STORAGE_DISPLAY_ITEMS);
      return res.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });

    const channelInfos = await $axios.$get("/api/channel/list").then(res => {
      return res.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });
    const channelNameToId = {};
    const channelIdToName = {};
    const filter = { channel: "すべて", caption: "あり" };
    let filteredItems = items;
    for (let e of channelInfos) {
      channelNameToId[e.channelName] = e.id;
      channelIdToName[e.id] = e.channelName;
    }

    if (channelIdToName[query.channel]) {
      filter.channel = channelIdToName[query.channel];
      filteredItems = filteredItems.filter(e => e[videoSheetColumn.CHANNEL_ID] === query.channel);
    }

    const captionStatusToFilterItems = {
      "uploaded,dotlive_button": "あり",
      "partial": "一部のみ",
      "asr": "自動生成",
      "editable": "編集可",
      "not_permitted": "編集不可",
    };
    if (captionStatusToFilterItems[query.caption]) {
      filter.caption = captionStatusToFilterItems[query.caption];
      const split = query.caption.split(",");
      filteredItems = filteredItems.filter(e => split.some(cond => e[videoSheetColumn.STATUS].includes(cond)));
    } else {
      filter.caption = "あり";
      filteredItems = filteredItems.filter(e => ["uploaded", "dotlive_button"].some(cond => e[videoSheetColumn.STATUS].includes(cond)));
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
  fetch({ store, query }) {
    store.commit("videoListPage/captionFilter", query.caption);
    store.commit("search/channelIdFilter", query.channel ? query.channel : "");
    store.commit("search/captionStatusFilter", query.caption ? query.caption : "");
  },
  computed: {
    isMobile() {
      return ["xs", "sm"].some(e => {
        return this.$vuetify.breakpoint.name === e;
      });
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
        this.filteredItems = this.filteredItems.filter(e => split.some(cond => e[videoSheetColumn.STATUS].includes(cond)));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CAPTION_FILTER);
        this.filter.caption = "あり";
        this.filteredItems = this.filteredItems.filter(e => ["uploaded", "dotlive_button"].some(cond => e[videoSheetColumn.STATUS].includes(cond)));
      }

      this.$store.commit("search/channelIdFilter", to.query.channel ? to.query.channel : "");
      this.$store.commit("search/captionStatusFilter", to.query.caption ? to.query.caption : "");
      this.$store.commit("videoListPage/captionFilter", to.query.caption);

      this.infiniteId++;
      this.displayItems = this.filteredItems.slice(0, Math.min(ITEM_PER_PAGE, this.filteredItems.length));
      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS, JSON.stringify(this.displayItems));
    }
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
    onScroll(e) {
      if (typeof window === 'undefined') return;
      const top = window.pageYOffset || e.target.scrollTop || 0;
      this.scrollToTopFab = top > 20;
    },
    scrollToTop() {
      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
        this.scrollToTopFab = false;
      });
    },
    openCaptionFilterHelpDialog() {
      this.$refs.captionFilterHelpDialog.open();
    }
  },
}
</script>

<style>
.video-card {
  width: 75vw;
}
.video-card--mobile {
  width: 95%;
}
.video-filter--mobile .v-messages {
  min-height: 0;
}
.video-filter--mobile.v-text-field {
  padding-top: 0;
}
</style>
