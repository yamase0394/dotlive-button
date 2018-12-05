<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      :timeout="2000"
      top
    >
      {{ snackbarText }}
    </v-snackbar>
    <v-container
      grid-list-md
      fluid
      class="video-id-root"
    >
      <v-layout row>
        <v-flex
          class="video-layout"
          xs7
        >
          <v-layout
            row
            wrap
          >
            <v-flex>
              <v-btn-toggle v-model="repeats">
                <v-tooltip bottom>
                  <v-btn
                    slot="activator"
                    :value="true"
                    class="toggele__btn"
                    flat
                  >
                    <v-icon>loop</v-icon>
                  </v-btn>
                  <span>指定範囲をリピート再生する</span>
                </v-tooltip>
              </v-btn-toggle>
            </v-flex>
            <v-flex xs12>
              <v-responsive :aspect-ratio="16/9">
                <youtube
                  ref="youtube"
                  :video-id="videoId"
                  :player-vars="{
                    start: Math.floor(start),
                    rel: 0
                  }"
                  width="100%"
                  height="100%"
                  @playing="playing"
                />
              </v-responsive>
            </v-flex>
            <v-layout
              xs12
              column
            >
              <v-flex
                class="video-info-container"
                xs12
              >
                <div class="grey--text">{{ new Date(publishedAt).toLocaleString() }}</div>
                <div
                  class="video-title"
                  v-html="videoTitle"
                />
                <v-divider />
                <div :style="{marginTop:'5px'}">
                  <span class="grey--text"> 内容 </span><br>
                  <span
                    :style="{marginLeft:'5px'}"
                    v-html="selectedText"
                  /> <br>
                </div>
              </v-flex>
              <v-flex
                :style="{marginTop:'3px', maxHeight:'14px'}"
                class="no-padding grey--text"
              >URL
              </v-flex>
              <v-layout align-center>
                <v-flex
                  class="no-padding"
                  xs9
                >
                  <v-text-field
                    :value="shareUrl"
                    class="clipboard"
                    readonly
                    hide-details
                    @focus="$event.target.select()"
                  />
                </v-flex>
                <v-flex class="no-padding">
                  <v-tooltip top>
                    <v-btn
                      v-clipboard:copy="shareUrl"
                      v-clipboard:success="onCopy"
                      v-clipboard:error="onCopyError"
                      slot="activator"
                      class="small-button"
                      depressed
                    >
                      <v-icon small>
                        file_copy
                      </v-icon>
                    </v-btn>
                    <span>URLをクリップボードに貼り付ける</span>
                  </v-tooltip>
                </v-flex>
                <v-flex class="no-padding">
                  <v-tooltip top>
                    <v-btn
                      slot="activator"
                      class="small-button"
                      depressed
                      @click="openVideoInNewTab"
                    >
                      <v-icon small>
                        movie
                      </v-icon>
                    </v-btn>
                    <span>YouTubeで開く</span>
                  </v-tooltip>
                </v-flex>
              </v-layout>
              <v-flex class="no-padding">
                <div :style="{marginTop:'10px'}">
                  <span class="grey--text"> 説明 </span><br>
                </div>
                <div
                  :class="['video-description', expandDescriptionBtnText == 'もっと見る' ?'video-description-hidden':'']"
                  v-html="videoDescription"
                />
                <v-btn
                  v-if="videoDescription.split(/\r\n|\r|\n/).length > 3"
                  class="expand-description-btn transparent"
                  flat
                  @click="onExpandDescriptionClicked"
                >
                  {{ expandDescriptionBtnText }}
                </v-btn>
                <div class="subscribe-btn">
                  <script src="https://apis.google.com/js/platform.js" />
                  <div
                    :data-channelid="channelId"
                    class="g-ytsubscribe"
                    data-layout="full"
                    data-theme="dark"
                    data-count="default"/>
                </div>
              </v-flex>
            </v-layout>
          </v-layout>
        </v-flex>
        <v-flex
          xs5>
          <v-layout
            column
            px-3
            pt-0>
            <v-flex>
              <v-text-field
                v-model="filterText"
                solo
                clearable
                hide-details
                append-icon="search"
                class="button__searchbox"
                @input="filterSubtitle"
              />
            </v-flex>
            <v-flex>
              <v-container
                fluid
                class="flex-container"
                grid-list-md >
                <v-layout
                  ref="scrollableSubLayout"
                  row
                  wrap
                  class="flex-scrollable"
                  align-content-start>
                  <v-flex
                    v-for="item in filteredSubtitles"
                    :key="item[5]">
                    <simple-voice-card
                      :start="Number(item[0])"
                      :end="(Number(item[1])*1000 + Number(item[0])*1000) / 1000"
                      :text="item[2]"
                      :id="item[5]"
                      :selected-id="selectedId"
                      @btnClicked="onVoiceBtnClicked"
                    />
                  </v-flex>
                </v-layout>
              </v-container>
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import SimpleVoiceCard from '~/components/SimpleVoiceCard.vue'
import axios from "axios"
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import VueClipboard from 'vue-clipboard2'
import AsyncLock from "async-lock";

Vue.use(VueYoutube)
Vue.use(VueClipboard)

const lock = new AsyncLock();
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

export default {
  components: {
    SimpleVoiceCard
  },
  data() {
    return {
      subtitles: [],
      channelIdToThumb: {},
      start: null,
      end: null,
      repeats: true,
      destroyed: false,
      channelId: "",
      videoId: "",
      publishedAt: "",
      videoTitle: "",
      videoDescription: "",
      filterText: "",
      filteredSubtitles: [],
      hasPlayed: false,
      selectedId: "",
      selectedText: "",
      expandDescriptionBtnText: "もっと見る",
      videoUrl: "",
      snackbar: false,
      snackbarText: "",
      shareUrl: "",
    }
  },
  async asyncData({ params, query, error }) {
    let selectedText = "未選択";
    let selectedId = "";
    const start = Number(query.start);
    const end = Number(query.end);

    const resSub = await axios.post("/api/subtitle", { id: params.videoId, type: "video" });
    for (const element of resSub.data.items) {
      if (start == Number(element[0]) && end == (Number(element[1]) * 1000 + Number(element[0]) * 1000) / 1000) {
        selectedText = element[2];
        selectedId = element[5];
        break;
      }
    }

    const resVideo = await axios.post("/api/video", {
      id: params.videoId,
      type: "video"
    });

    const channelIdToThumb = {};
    for (let element of resSub.data.items) {
      if (!(element[3] in channelIdToThumb)) {
        const resChannel = await axios.get(`/api/channel/${element[3]}`);
        channelIdToThumb[element[3]] = resChannel.data.url;
        break;
      }
    }

    let videoUrl;
    const videoId = resVideo.data.items[1];
    console.log(start);
    if (isNaN(start)) {
      videoUrl = `https://youtu.be/${videoId}`;
    } else {
      if (isNaN(end)) {
        videoUrl = `https://youtu.be/${videoId}?start=${Math.floor(start)}`;
      } else {
        videoUrl = `https://youtu.be/${videoId}?start=${Math.floor(start)}&end=${Math.ceil(end)}`;
      }
    }

    let shareUrl;
    if (isNaN(start) || isNaN(end)) {
      shareUrl = `${location.protocol}//${location.host}/video/${videoId}`
    } else {
      shareUrl = `${location.protocol}//${location.host}/video/${videoId}?start=${start}&end=${end}`
    }

    return {
      subtitles: resSub.data.items,
      channelIdToThumb: channelIdToThumb,
      channelId: resVideo.data.items[0],
      videoId: videoId,
      publishedAt: resVideo.data.items[2],
      videoTitle: resVideo.data.items[3],
      videoDescription: resVideo.data.items[4],
      filteredSubtitles: resSub.data.items,
      start: start,
      end: end,
      videoUrl: videoUrl,
      shareUrl: shareUrl,
      selectedText: selectedText,
      selectedId: selectedId,
    };
  },
  mounted() {
    this.$refs.scrollableSubLayout.addEventListener("wheel", this.onScroll);
    this.repeat();
  },
  async beforeDestroy() {
    this.$refs.scrollableSubLayout.removeEventListener("wheel", this.onScroll);
  },
  destroyed() {
    this.destroyed = true;
  },
  methods: {
    async toThumb(channelId) {
      const res = await axios.get(`/api/channelid/${channelId}`)
      return res;
    },
    onScroll(event) {
      const el = this.$refs.scrollableSubLayout;
      if (el.scrollTop === 0 && event.deltaY < 0 ||
        Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)) <= 1 &&
        event.deltaY > 0) {
        event.preventDefault()
      }
    },
    async onVoiceBtnClicked(id, start, end, text) {
      this.$router.replace(`/video/${this.videoId}?start=${start}&end=${end}`);
      this.$refs.youtube.player.seekTo(start, true);
      this.selectedId = id;
      this.start = start;
      this.end = end;
      this.selectedText = text;
      this.videoUrl = `https://youtu.be/${this.videoId}?start=${Math.floor(start)}&end=${Math.ceil(end)}`;
      this.shareUrl = `${location.protocol}//${location.host}/video/${this.videoId}?start=${start}&end=${end}`;

      await this.sendPlayCount();
    },
    repeat() {
      async function loop() {
        if (this.hasPlayed && this.repeats && this.start != null && this.end != null) {
          const currentTime = await this.$refs.youtube.player.getCurrentTime();
          if (currentTime < this.start || this.end < currentTime) {
            this.$refs.youtube.player.seekTo(this.start, true);
            this.$refs.youtube.player.playVideo();

            await this.sendPlayCount();
          }
        }

        if (!this.destroyed) {
          setTimeout(loop.bind(this), 30);
        }
      };
      loop.bind(this)();
    },
    filterSubtitle() {
      if (!this.filterText) {
        this.filteredSubtitles = this.subtitles;
        return;
      }

      this.filteredSubtitles = this.subtitles.filter(e => e[2].includes(this.filterText));
    },
    async playing() {
      if (!this.hasPlayed) {
        await this.sendPlayCount();
        this.hasPlayed = true;
      }
    },
    onExpandDescriptionClicked() {
      switch (this.expandDescriptionBtnText) {
        case "もっと見る":
          this.expandDescriptionBtnText = "一部を表示";
          break;
        case "一部を表示":
          this.expandDescriptionBtnText = "もっと見る";
          break;
      }
    },
    onCopy() {
      this.snackbarText = "クリップボードにコピーしました";
      this.snackbar = true;
    },
    onCopyError() {
      this.snackbarText = "コピーに失敗しました";
      this.snackbar = true;
    },
    openVideoInNewTab() {
      window.open(this.videoUrl);
      this.$refs.youtube.player.pauseVideo();
    },
    async sendPlayCount() {
      if (this.selectedId && !lock.isBusy(`${this.start}${this.end}${this.selectedText}`)) {
        await lock.acquire(`${this.start}${this.end}${this.selectedText}`, async () => {
          axios.post("/api/update/count", { items: [{ start: this.start, end: this.end, text: this.selectedText, videoId: this.videoId, count: 1 }] });
          await sleep(Math.max((this.end - this.start) * 1000 - 200, 0));
        });
      }
    }
  },
}
</script>

<style>
.flex {
  flex: 0 1 auto;
}
.flex-container {
  height: calc(100vh - 170px);
  margin-right: 20px;
  padding: 0;
}
.flex-scrollable {
  overflow-y: scroll;
  height: 100%;
}
.video-id-root {
  margin-top: 12px;
  padding: 0;
}
.video-layout {
  margin-left: 20px;
}
.video-title {
  font-size: 16px;
  margin: 3px 0 5px 0;
}
.video-description {
  font-size: 14px;
  white-space: pre-wrap;
  margin-top: 3px;
}
.video-description-hidden {
  display: -webkit-box;
  /* autoprefixer: off */
  -webkit-box-orient: vertical;
  /* autoprefixer: on */
  -webkit-line-clamp: 3;
  overflow: hidden;
}
.video-info-container {
  margin: 5px 0 0 0;
  padding: 0 !important;
}
.small-button {
  margin: 0 0 0 8px;
  min-width: auto;
}
.expand-description-btn {
  margin: 0;
  padding: 0;
  font-size: 12px;
  color: gray !important;
}
.subscribe-btn {
  margin: 5px 0 10px 0;
}
.toggele__btn {
  padding: 0 4px !important;
  height: 32px;
}
.button__searchbox.v-text-field.v-text-field--solo .v-input__control {
  min-height: 35px;
}
.button__searchbox .v-input__control .v-input__slot {
  margin-bottom: 0;
}
.clipboard {
  margin: 0 15px;
  padding: 0;
}
.clipboard .v-text-field {
  margin-top: 0;
  padding-top: 0;
}
.clipboard .v-text-field input {
  padding: 2px 0 8px;
}
.no-padding {
  padding: 0 !important;
}
</style>