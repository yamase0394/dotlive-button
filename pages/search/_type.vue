<template>
  <v-layout
    :class="[{'pt-2':!isMobile}, {'pt-0':isMobile}]"
    align-center
    column
  >
    <p
      :class="[{'mt-3 mb-1':!isMobile}, {'mt-2 mb-0':isMobile}]"
      class="grey--text"
    >
      検索結果 : {{ resultCount }}件
    </p>
    <v-select
      v-model="filter.channel"
      :class="[{'channel-filter':!isMobile}, {'channel-filter--mobile':isMobile}]"
      :items="channelFilterItems"
      :menu-props="{ maxHeight: '70vh' }"
      @change="onChannelFilterChanged"
    />
    <v-layout
      :class="[{'voice-card-container':!isMobile}, {'voice-card-container--mobile':isMobile}]"
      row
      wrap
    >
      <v-flex
        v-for="item in subtitles"
        :key="item[5]"
        shrink
        :class="[{'pa-1':!isMobile},{'voice-card-padding':isMobile}]"
      >
        <voice-card
          :id="item[5]"
          :ref="item[5]"
          :start="Number(item[0])"
          :end="(Number(item[1])*1000 + Number(item[0])*1000) / 1000"
          :text="(item[2])"
          :video-id="item[4]"
          :avater-url="channelIdToThumb[item[3]]"
          :type="type"
          @btnClickedEvent="onVoiceCardBtnClicked"
        />
      </v-flex>
    </v-layout>
    <v-pagination
      v-model="pageNumber"
      :class="[{'my-4':!isMobile}, {'my-1':isMobile}]"
      :length="pageCount"
      :total-visible="isMobile ? 5 : 9"
      @input="next"
    />
  </v-layout>
</template>

<script>
import VoiceCard from '~/components/VoiceCard.vue'

export default {
  components: {
    VoiceCard
  },
  data() {
    return {
      pageNumber: 1,
      subtitles: [],
      pageCount: 0,
      channelIdToThumb: {},
      channelIdToName: {},
      channelNameToId: {},
      channelFilterItems: [],
      filter: null,
      selectedVoiceCard: "-1",
      resultCount: 0,
      type: "button"
    }
  },
  async asyncData({ params, query, error, $axios }) {
    console.log("asyncData");

    const page = isNaN(parseInt(query.page)) ? 1 : Number(query.page);

    let searchResult = {
      resultCount: 0,
      pageCount: 0,
      items: []
    };
    if (query.keyword) {
      if (query.channel != null) {
        searchResult = await $axios.$post("/api/search/" + params.type, {
          keyword: query.keyword,
          page: page,
          filter: { type: "channel", id: query.channel }
        });
      } else {
        searchResult = await $axios.$post("/api/search/" + params.type, {
          keyword: query.keyword,
          page: page
        });
      }
    }

    const channelInfos = await $axios.$get("/api/channel/list").then(res => {
      return res.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });
    const channelIdToThumb = {};
    const channelIdToName = {};
    const channelNameToId = {};
    const filter = { channel: "すべて" };
    for (let e of channelInfos) {
      channelIdToThumb[e.id] = e.url;
      channelIdToName[e.id] = e.channelName;
      channelNameToId[e.channelName] = e.id;
      if (query.channel === e.id) {
        filter.channel = e.channelName;
      }
    }

    const channelFilterItems = ["すべて", ...Object.keys(channelNameToId)];

    return {
      pageNumber: page,
      resultCount: searchResult.resultCount,
      pageCount: searchResult.pageCount,
      subtitles: searchResult.items,
      channelIdToThumb: channelIdToThumb,
      channelIdToName: channelIdToName,
      channelNameToId: channelNameToId,
      channelFilterItems: channelFilterItems,
      filter: filter,
      type: params.type
    };
  },
  fetch({ store, params, query }) {
    store.commit("search/target", "button");
    store.commit("search/includesAsr", params.type === "asr");
    store.commit("search/keyword", query.keyword ? query.keyword : "");
    store.commit("search/channelIdFilter", query.channel ? query.channel : "");
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
      if (!to.query.keyword) {
        return;
      }
      this.$nuxt.$loading.start();

      this.$store.commit("search/keyword", to.query.keyword);

      const page = to.query.page ? Number(to.query.page) : 1;

      let reqBody;
      if (this.channelIdToName[to.query.channel]) {
        console.log("search channel");
        this.filter.channel = this.channelIdToName[to.query.channel];
        reqBody = {
          keyword: to.query.keyword,
          page: page,
          filter: { type: "channel", id: to.query.channel }
        };
        this.$store.commit("search/channelIdFilter", to.query.channel);
      } else {
        this.filter.channel = "すべて";
        reqBody = {
          keyword: to.query.keyword,
          page: page
        };
        this.$store.commit("search/channelIdFilter", "");
      }
      const searchResult = await this.$axios.$post("/api/search/" + to.params.type, reqBody);

      this.resultCount = searchResult.resultCount;
      this.subtitles = searchResult.items;
      this.pageCount = searchResult.pageCount;
      this.pageNumber = page;
      this.selectedVoiceCard = "-1";

      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
        this.$nuxt.$loading.finish();
      });
    },
  },
  methods: {
    next() {
      if (this.channelIdToName[this.$route.query.channel]) {
        this.$router.push({ query: { keyword: this.$route.query.keyword, channel: this.channelNameToId[this.filter.channel], page: this.pageNumber } });
      } else {
        this.$router.push({ query: { keyword: this.$route.query.keyword, page: this.pageNumber } });
      }
    },
    onChannelFilterChanged(selectedChannName) {

      if (this.$route.query.channel === this.channelNameToId[selectedChannName]) {
        //ブラウザの進むor戻る
        return;
      }

      this.$router.push({ query: { keyword: this.$route.query.keyword, channel: this.channelNameToId[selectedChannName], page: 1 } });
    },
    onVoiceCardBtnClicked(id) {
      if (this.$refs.hasOwnProperty(this.selectedVoiceCard)) {
        this.$refs[this.selectedVoiceCard][0].select(false);
      }
      this.$refs[id][0].select(true);
      this.selectedVoiceCard = id;
    },
  },
}
</script>

<style>
.voice-card-container {
  width: 75vw;
}
.voice-card-container--mobile {
  width: 90vw;
}
.channel-filter {
  width: 20vw;
}
.channel-filter--mobile {
  width: 70vw;
}
.channel-filter--mobile .v-messages {
  min-height: 0;
}
.channel-filter--mobile.v-text-field {
  padding-top: 0;
}
.voice-card-padding {
  padding: 2px;
}
</style>
