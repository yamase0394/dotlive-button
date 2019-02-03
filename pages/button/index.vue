<template>
  <div v-scroll="onScroll">
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
        row
        wrap
        :class="[{'voice-card-container':!isMobile}, {'voice-card-container--mobile':isMobile}]"
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
    </v-layout>
    <infinite-loading
      ref="infiniteLoading"
      spinner="spiral"
      @infinite="infiniteHandler"
    >
      <span slot="no-results" />
      <span slot="no-more" />
    </infinite-loading>
  </div>
</template>

<script>
import VoiceCard from '~/components/VoiceCard.vue'
import InfiniteLoading from 'vue-infinite-loading';

const SUBTITLE_SHEET_COLUMN_ID = 5;

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
  async asyncData({ params, query, error, $axios }) {
    const subtitles = await $axios.$post("/api/subtitle", { type: "random" })
      .then(res => res.items)
      .catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });
    const subtitleIdSet = new Set(subtitles.map(e => e[SUBTITLE_SHEET_COLUMN_ID]));

    const channelInfos = await $axios.$get("/api/channel/list")
      .then(res => res.items)
      .catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });
    const channelIdToThumb = {};
    const channelIdToName = {};
    const channelNameToId = {}
    for (const e of channelInfos) {
      channelIdToThumb[e.id] = e.url;
      channelIdToName[e.id] = e.channelName;
      channelNameToId[e.channelName] = e.id;
    }

    return {
      subtitles: subtitles,
      channelIdToThumb: channelIdToThumb,
      channelIdToName: channelIdToName,
      channelNameToId: channelNameToId,
      channelFilterItems: ["ランダム", "すべて", ...Object.keys(channelNameToId)],
      subtitleIdSet: subtitleIdSet
    };
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

      const items = await this.$axios.$post("/api/subtitle", { type: "random" }).catch(e => {
        this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
      });

      this.subtitles = this.subtitles.concat(items);

      this.$nextTick(() => {
        this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
      });
    },
  },
  created() {
    this.$nextTick(() => {
      this.$vuetify.goTo(0, { duration: 200, offset: 0, easing: "easeOutCubic" });
    });
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
        const newSubtitles = await this.$axios.$post("/api/subtitle", { type: "random" })
          .then(res => res.items)
          .catch(e => {
            this.$nuxt.error({ statusCode: 404, message: 'Page not found' });
          });

        const filteredSubtitles = newSubtitles.filter(e => !this.subtitleIdSet.has(e[SUBTITLE_SHEET_COLUMN_ID]));
        filteredSubtitles
          .map(e => e[SUBTITLE_SHEET_COLUMN_ID])
          .forEach(e => {
            this.subtitleIdSet.add(e);
          });
        this.subtitles = this.subtitles.concat(filteredSubtitles);
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
        this.scrollToTopFab = false;
      });
    }
  }
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
