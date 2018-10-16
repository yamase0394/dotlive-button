<template>
  <div>
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
      ref="rootLayout"
      class="voice-root"
      align-center
      column>
      <v-flex>
        <v-select
          v-model="filter.channel"
          :items="channelFilterItems"
          @change="onChannelFilterChanged"
        />
      </v-flex>
      <v-flex>
        <v-container
          fluid
          px-5
          pt-0
          grid-list-md >
          <v-layout
            row
            wrap
            class="voice-card-container"
          >
            <v-flex
              v-for="item in subtitles"
              :key="item[5]"
            >
              <voice-card
                :start="Number(item[0])"
                :end="Number(item[1]) + Number(item[0])"
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
    </v-layout>
    <infinite-loading
      ref="infiniteLoading"
      spinner="spiral"
      @infinite="infiniteHandler">
      <span slot="no-results"/>
      <span slot="no-more"/>
    </infinite-loading>
  </div>
</template>

<script>
import VoiceCard from '~/components/VoiceCard.vue'
import axios from "axios"
import InfiniteLoading from 'vue-infinite-loading';

export default {
  components: {
    InfiniteLoading,
    VoiceCard
  },
  data() {
    return {
      subtitles: [],
      subtitleIdSet: null,
      channelIdToThumb: {},
      channelIdToName: {},
      channelNameToId: {},
      channelFilterItems: [],
      filter: { channel: "ランダム" },
      selectedVoiceCard: "-1",
      scrollToTopFab: false
    }
  },
  async asyncData({ params, query, error }) {
    const res = await axios.post("/api/subtitle", { type: "random" }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });
    const subtitleIdSet = new Set();
    res.data.items.forEach(e => {
      subtitleIdSet.add(e[5]);
    });

    const channelIds = await axios.get("/api/subtitle/channel").then(res => {
      return res.data.items;
    }).catch(e => {
      this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
    });

    const channelIdToThumb = {};
    const channelIdToName = {};
    const channelNameToId = {}
    for (let channelId of channelIds) {
      const res = await axios.get(`/api/channel/${channelId}`).catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });
      channelIdToThumb[channelId] = res.data.url;
      channelIdToName[channelId] = res.data.channelName;
      channelNameToId[res.data.channelName] = channelId;
    }

    return {
      subtitles: res.data.items,
      channelIdToThumb: channelIdToThumb,
      channelIdToName: channelIdToName,
      channelNameToId: channelNameToId,
      channelFilterItems: ["ランダム", "すべて", ...Object.keys(channelNameToId)],
      subtitleIdSet: subtitleIdSet
    };
  },
  watch: {
    '$route': async function (to, from) {

      const res = await axios.post("/api/subtitle", { type: "random" }).catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });

      this.subtitles = this.subtitles.concat(res.data.items);

      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
      });
    },
  },
  created() {
    this.$emit("searchTargetChangedEvent", "button");
    this.$nextTick(() => {
      this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
    });
  },
  mounted() {
    this.$refs.rootLayout.addEventListener("wheel", this.onScroll);
  },
  beforeDestroy() {
    this.$refs.rootLayout.removeEventListener("wheel", this.onScroll);
  },
  methods: {
    onChannelFilterChanged(selectedChannName) {
      this.$router.push({
        path: "/button/list",
        query: { channel: this.channelNameToId[selectedChannName], page: 1 }
      });
    },
    onVoiceCardBtnClicked(id) {
      if (this.$refs.hasOwnProperty(this.selectedVoiceCard)) {
        this.$refs[this.selectedVoiceCard][0].select(false);
      }
      this.$refs[id][0].select(true);
      this.selectedVoiceCard = id;
    },
    infiniteHandler($state) {
      console.log("infinite");
      setTimeout(async () => {
        const res = await axios.post("/api/subtitle", { type: "random" }).catch(e => {
          this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
        });
        const temp = res.data.items.filter(e => !this.subtitleIdSet.has(e[5]));
        temp.forEach(e => {
          this.subtitleIdSet.add(e[5]);
        })
        this.subtitles = this.subtitles.concat(temp);
        $state.loaded();
      }, 600);
    },
    onScroll(e) {
      if (typeof window === 'undefined') return
      const top = window.pageYOffset || e.target.scrollTop || 0
      this.scrollToTopFab = top > 20
    },
    scrollToTop() {
      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
      });
    }
  }
}
</script>

<style>
.voice-card-container .flex {
  flex: 0 1 auto;
}
.v-pagination {
  margin: 20px 0;
}
.voice-root {
  padding-top: 20px;
}
</style>