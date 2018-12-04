<template>
  <v-layout
    class="voice-root"
    align-center
    column
  >
    <v-flex>
      <v-select
        v-model="filter.channel"
        :items="channelFilterItems"
        :menu-props="{ maxHeight: '80vh' }"
        @change="onChannelFilterChanged"
      />
    </v-flex>
    <v-flex>
      <v-container
        fluid
        px-5
        pt-0
        grid-list-md
      >
        <v-layout
          row
          wrap
        >
          <v-flex
            v-for="item in subtitles"
            :key="item[5]"
          >
            <voice-card
              :start="Number(item[0])"
              :end="(Number(item[1])*1000 + Number(item[0])*1000) / 1000"
              :text="(item[2])"
              :video-id="item[4]"
              :avater-url="channelIdToThumb[item[3]]"
              :id="item[5]"
              :ref="item[5]"
              @btnClickedEvent="onVoiceCardBtnClicked"
            />
          </v-flex>
        </v-layout>
      </v-container>
    </v-flex>
    <v-flex>
      <v-pagination
        v-model="pageNumber"
        :length="pageCount"
        :total-visible="9"
        @input="next"
      />
    </v-flex>
  </v-layout>
</template>

<script>
import VoiceCard from '~/components/VoiceCard.vue'
import axios from "axios"

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
    }
  },
  async asyncData({ params, query, error }) {
    const page = isNaN(parseInt(query.page)) ? 1 : Number(query.page);
    let res;
    if (query.channel != null) {
      res = await axios.post("/api/subtitle", { page: page, id: query.channel, type: "channel" });
    } else {
      res = await axios.post("/api/subtitle", { page: page, type: "all" });
    }
    if (res.status !== 200) {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    }

    const channelIds = await axios.get("/api/subtitle/channel").then(res => {
      return res.data.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });

    const channelIdToThumb = {};
    const channelIdToName = {};
    const channelNameToId = {};
    const filter = { channel: "すべて" };
    for (let channelId of channelIds) {
      const res = await axios.get(`/api/channel/${channelId}`).catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });
      channelIdToThumb[channelId] = res.data.url;
      channelIdToName[channelId] = res.data.channelName;
      channelNameToId[res.data.channelName] = channelId;
      if (query.channel === channelId) {
        filter.channel = res.data.channelName;
      }
    }

    const channelFilterItems = ["ランダム", "すべて", ...Object.keys(channelNameToId)];

    return {
      pageNumber: page,
      pageCount: res.data.pageCount,
      subtitles: res.data.items,
      channelIdToThumb: channelIdToThumb,
      channelIdToName: channelIdToName,
      channelNameToId: channelNameToId,
      channelFilterItems: channelFilterItems,
      filter: filter
    };
  },
  watch: {
    '$route': async function (to, from) {
      const page = to.query.page ? Number(to.query.page) : 1;
      let res;
      if (this.channelIdToName[to.query.channel]) {
        this.filter.channel = this.channelIdToName[to.query.channel];
        res = await axios.post("/api/subtitle", { page: page, id: to.query.channel, type: "channel" });
      } else {
        this.filter.channel = "すべて";
        res = await axios.post("/api/subtitle", { page: page, type: "all" });
      }
      if (res.status !== 200) {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      }

      this.subtitles = res.data.items;
      this.pageCount = res.data.pageCount;
      this.pageNumber = page;
      this.selectedVoiceCard = "-1";

      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
      });
    },
  },
  created() {
    this.$emit("searchTargetChangedEvent", "button");
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
.flex {
  flex: 0 1 auto;
}
.v-pagination {
  margin: 20px 0;
}
.voice-root {
  padding-top: 20px;
}
</style>
