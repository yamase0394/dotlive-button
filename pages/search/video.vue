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
    >
      <p
        :class="[{'mt-3':!isMobile}, {'mt-2':isMobile}]"
        class="grey--text"
      >
        検索結果 : {{ resultCount }}件
      </p>
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
const SESSION_STORAGE_CHANNEL_FILTER_SEARCH = "searchVideoPreChannelFilterSearch";
const SESSION_STORAGE_CAPTION_FILTER_SEARCH = "videoListPreCaptionFilterSearch";
const SESSION_STORAGE_DISPLAY_ITEMS_SEARCH = "searchVideoPreDisplayItemsSearch";
const SESSION_STORAGE_KEYWORD_SEARCH = "searchVideoKeywordSearch";
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
      resultCount: 0,
      scrollToTopFab: false,
      infiniteId: 0
    }
  },
  async asyncData({ params, query, error, $axios }) {
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

      return res.items;
    }).catch(e => {
      error({ statusCode: 404, message: 'Page not found' });
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
      filteredItems = filteredItems.filter(e => ["uploaded", "dotlive_button"].some(cond => e[videoSheetColumn.STATUS].includes(cond)));
    }

    if (query.keyword) {
      const searchRegs = query.keyword.split(/\s+/).map(str => new RegExp(str, "i"));
      filteredItems = filteredItems.filter(e => searchRegs.every(
        reg => reg.test(e[videoSheetColumn.TITLE]) || reg.test[videoSheetColumn.DESCRIPTION]
      ));
    } else {
      filteredItems = [];
    }

    const captionFilterItemToStatus = {};
    Object.keys(captionStatusToFilterItems).forEach(key => {
      captionFilterItemToStatus[captionStatusToFilterItems[key]] = key;
    });

    const storedDisplayItem = sessionStorage.getItem(SESSION_STORAGE_DISPLAY_ITEMS_SEARCH);
    const storedChannelFilter = sessionStorage.getItem(SESSION_STORAGE_CHANNEL_FILTER_SEARCH);
    const storedKeyword = sessionStorage.getItem(SESSION_STORAGE_KEYWORD_SEARCH);
    const storedCaptionStatusFilter = sessionStorage.getItem(SESSION_STORAGE_CAPTION_FILTER_SEARCH);
    let displayItems;
    if (storedDisplayItem &&
      (query.channel === storedChannelFilter ||
        !query.channel && !storedChannelFilter) &&
      query.keyword === storedKeyword &&
      (query.caption === storedCaptionStatusFilter ||
        !query.caption && !storedCaptionStatusFilter)) {
      console.log("hit cache");
      displayItems = JSON.parse(storedDisplayItem);
    } else {
      console.log("no cache");
      displayItems = filteredItems.slice(0, Math.min(ITEM_PER_PAGE, filteredItems.length));

      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS_SEARCH, JSON.stringify(displayItems));

      if (channelNameToId[filter.channel]) {
        sessionStorage.setItem(SESSION_STORAGE_CHANNEL_FILTER_SEARCH, channelNameToId[filter.channel]);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CHANNEL_FILTER_SEARCH);
      }

      if (channelNameToId[filter.caption]) {
        sessionStorage.setItem(SESSION_STORAGE_CAPTION_FILTER_SEARCH, captionFilterItemToStatus[filter.caption]);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CAPTION_FILTER_SEARCH);
      }

      if (query.keyword) {
        sessionStorage.setItem(SESSION_STORAGE_KEYWORD_SEARCH, query.keyword);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEYWORD_SEARCH)
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
  fetch({ store, params, query }) {
    store.commit("search/target", "video");
    store.commit("search/keyword", query.keyword ? query.keyword : "");
    store.commit("search/channelIdFilter", query.channel ? query.channel : "");
    store.commit("search/captionStatusFilter", query.caption ? query.caption : "");
    store.commit("videoListPage/captionFilter", query.caption);
  },
  computed: {
    isMobile() {
      return ["xs", "sm"].some(e => {
        return this.$vuetify.breakpoint.name === e;
      });
    }
  },
  watch: {
    "$route": async function (to, from) {
      console.log("route");

      let temp = this.items;

      if (to.query.keyword) {
        const searchRegs = to.query.keyword.split(/\s+/).map(str => new RegExp(str, "i"));
        temp = temp.filter(e => searchRegs.every(reg =>
          reg.test(e[videoSheetColumn.TITLE]) || reg.test[videoSheetColumn.DESCRIPTION]
        ));
        sessionStorage.setItem(SESSION_STORAGE_KEYWORD_SEARCH, to.query.keyword);
      } else {
        temp = [];
        sessionStorage.removeItem(SESSION_STORAGE_KEYWORD_SEARCH);
      }

      if (this.channelIdToName[to.query.channel]) {
        this.filter.channel = this.channelIdToName[to.query.channel];
        temp = temp.filter(e => to.query.channel === e[videoSheetColumn.CHANNEL_ID]);
        sessionStorage.setItem(SESSION_STORAGE_CHANNEL_FILTER_SEARCH, to.query.channel);
      } else {
        this.filter.channel = "すべて";
        sessionStorage.removeItem(SESSION_STORAGE_CHANNEL_FILTER_SEARCH);
      }

      if (this.captionStatusToFilterItems[to.query.caption]) {
        sessionStorage.setItem(SESSION_STORAGE_CAPTION_FILTER_SEARCH, to.query.caption);
        this.filter.caption = this.captionStatusToFilterItems[to.query.caption];
        const split = to.query.caption.split(",");
        temp = temp.filter(e => split.some(cond => e[videoSheetColumn.STATUS].includes(cond)));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_CAPTION_FILTER_SEARCH);
        this.filter.caption = "あり";
        temp = temp.filter(e => ["uploaded", "dotlive_button"].some(cond => e[videoSheetColumn.STATUS].includes(cond)));
      }
      this.$store.commit("videoListPage/captionFilter", to.query.caption);
      this.$store.commit("search/captionStatusFilter", to.query.caption ? to.query.caption : "");


      this.infiniteId++;
      this.filteredItems = temp;
      this.resultCount = this.filteredItems.length;
      this.displayItems = this.filteredItems.slice(0, Math.min(ITEM_PER_PAGE, this.filteredItems.length));
      sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS_SEARCH, JSON.stringify(this.displayItems));
    }
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
        sessionStorage.setItem(SESSION_STORAGE_DISPLAY_ITEMS_SEARCH, JSON.stringify(this.displayItems));
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

