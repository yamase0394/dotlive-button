<template>
  <v-layout
    :class="[{'pt-2':!isMobile}, {'pt-0':isMobile}]"
    align-center
    column
  >
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
          @btnClickedEvent="onVoiceCardBtnClicked"
        />
      </v-flex>
    </v-layout>
    <v-pagination
      v-model="pageNumber"
      :class="[{'my-4':!isMobile}, {'my-1':isMobile}]"
      :total-visible="isMobile ? 5 : 9"
      :length="pageCount"
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
      selectedVoiceCard: "-1"
    }
  },
  async asyncData({ params, query, error, $axios }) {
    const page = isNaN(parseInt(query.page)) ? 1 : Number(query.page);
    let subtitleRes;
    try {
      if (query.channel != null) {
        subtitleRes = await $axios.$post("/api/subtitle", { page: page, id: query.channel, type: "channel" });
      } else {
        subtitleRes = await $axios.$post("/api/subtitle", { page: page, type: "all" });
      }
    } catch (e) {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
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

    const channelFilterItems = ["ランダム", "すべて", ...Object.keys(channelNameToId)];

    return {
      pageNumber: page,
      pageCount: subtitleRes.pageCount,
      subtitles: subtitleRes.items,
      channelIdToThumb: channelIdToThumb,
      channelIdToName: channelIdToName,
      channelNameToId: channelNameToId,
      channelFilterItems: channelFilterItems,
      filter: filter
    };
  },
  fetch({ store, query }) {
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
      this.$nuxt.$loading.start();

      const page = to.query.page ? Number(to.query.page) : 1;
      let subtitleRes;
      if (this.channelIdToName[to.query.channel]) {
        this.filter.channel = this.channelIdToName[to.query.channel];
        subtitleRes = await this.$axios.$post("/api/subtitle", { page: page, id: to.query.channel, type: "channel" });
      } else {
        this.filter.channel = "すべて";
        subtitleRes = await this.$axios.$post("/api/subtitle", { page: page, type: "all" });
      }

      this.$store.commit("search/channelIdFilter", to.query.channel ? to.query.channel : "");

      this.subtitles = subtitleRes.items;
      this.pageCount = subtitleRes.pageCount;
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
        this.$router.push({ query: { channel: this.channelNameToId[this.filter.channel], page: this.pageNumber } });
      } else {
        this.$router.push({ query: { page: this.pageNumber } });
      }
    },
    onChannelFilterChanged(selectedChannName) {
      if (selectedChannName == "ランダム") {
        this.$router.push({ path: "/button" });
        return;
      }

      //ブラウザの進むor戻る
      if (this.$route.query.channel === this.channelNameToId[selectedChannName]) {
        return;
      }

      this.$router.push({ query: { channel: this.channelNameToId[selectedChannName], page: 1 } });
    },
    onVoiceCardBtnClicked(id) {
      if (this.$refs.hasOwnProperty(this.selectedVoiceCard)) {
        this.$refs[this.selectedVoiceCard][0].select(false);
      }
      this.$refs[id][0].select(true);
      this.selectedVoiceCard = id;
    }
  }
}
</script>

<style>
.v-pagination {
  margin: 20px 0;
}
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
