<template>
  <div>
    <notification-snackbar ref="notificationSnackbar" />
    <v-layout
      row
      wrap
    >
      <v-flex
        md7
        xs12
        :class="{'pl-3 py-3':!isMobile}"
      >
        <v-layout column>
          <v-layout
            row
            align-center
            :class="[{'pb-3':!isMobile},{'pb-1':isMobile}]"
          >
            <v-switch
              v-if="isPartial"
              v-model="showsAsr"
              class="v-swich--show-asr"
              label="自動生成"
              color="blue darken-2"
            />
            <v-tooltip
              v-if="canEdit && !isMobile"
              bottom
            >
              <v-btn
                slot="activator"
                flat
                class="button--edit small-button"
                depressed
                @click="onEditButtonClicked"
              >
                <v-icon>
                  edit
                </v-icon>
              </v-btn>
              <span>字幕作成ページに移動します</span>
            </v-tooltip>
          </v-layout>
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
          <v-layout
            row
            align-start
            :class="[{'px-2 pt-1':!isMobile},{'px-1 py-1 mobile-toolbar':isMobile}]"
          >
            <v-btn-toggle v-model="repeats">
              <v-btn
                :value="true"
                class="toggele__btn"
                depressed
                color="blue darken-2"
              >
                <v-icon>loop</v-icon>
                <span v-if="!isMobile">
                  リピート
                </span>
              </v-btn>
            </v-btn-toggle>
            <v-btn
              class="button--edit small-button"
              @click="onSelectCurrentTimeButtonClicked"
            >
              再生位置にある字幕を選択
            </v-btn>
            <v-spacer />
            <v-menu
              v-if="isMobile"
              v-model="mobileSearchMenu"
              left
              :close-on-content-click="false"
            >
              <v-btn
                slot="activator"
                class="search-button--mobile"
                icon
                flat
              >
                <v-icon>search</v-icon>
              </v-btn>
              <v-text-field
                v-model="filterText"
                solo
                clearable
                hide-details
                append-icon="search"
                class="button__searchbox"
                @input="filterSubtitle"
                @click:append="mobileSearchMenu = false"
              />
            </v-menu>
          </v-layout>
          <portal
            :disabled="!isMobile"
            to="destination"
          >
            <v-flex
              :class="[{'px-2 pt-3':!isMobile},{'px-3 pt-2':isMobile}]"
              xs12
            >
              <div class="grey--text">
                {{ new Date(publishedAt).toLocaleString() }}
              </div>
              <div
                style="word-break:break-word;heght:auto"
                class="py-1"
                v-html="videoTitle"
              />
              <v-divider />
              <div class="pt-2">
                <span class="grey--text">
                  内容
                </span><br>
                <span
                  class="pl-2"
                  v-html="selectedText"
                /> <br>
              </div>
              <div
                style="maxHeight:14px"
                class="grey--text pt-2"
              >
                URL
              </div>
              <v-layout
                pt-3
                row
              >
                <v-text-field
                  v-if="!isMobile"
                  :value="shareUrl"
                  class="clipboard pa-0 pl-2"
                  readonly
                  hide-details
                  @focus="$event.target.select()"
                />
                <v-tooltip top>
                  <v-btn
                    slot="activator"
                    v-clipboard:copy="shareUrl"
                    v-clipboard:success="onCopy"
                    v-clipboard:error="onCopyError"
                    class="small-button ml-0"
                    depressed
                  >
                    <v-icon small>
                      file_copy
                    </v-icon>
                    <span v-if="isMobile">
                      この字幕のURLをコピー
                    </span>
                  </v-btn>
                  <span>URLをクリップボードに貼り付ける</span>
                </v-tooltip>
                <v-tooltip top>
                  <v-btn
                    slot="activator"
                    class="small-button"
                    depressed
                    color="#FF0000"
                    @click="openVideoInNewTab"
                  >
                    <v-icon small>
                      fab fa-youtube
                    </v-icon>
                  </v-btn>
                  <span>YouTubeで開く</span>
                </v-tooltip>
                <v-tooltip top>
                  <v-btn
                    slot="activator"
                    depressed
                    class="small-button"
                    color="#00aced"
                    @click="openTwitterSharePage"
                  >
                    <v-icon small>
                      fab fa-twitter
                    </v-icon>
                  </v-btn>
                  <span>Twitterで共有する</span>
                </v-tooltip>
              </v-layout>
              <div class="pt-2">
                <span class="grey--text">
                  説明
                </span><br>
              </div>
              <div
                class="pl-2"
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
                  data-count="default"
                />
              </div>
            </v-flex>
          </portal>
        </v-layout>
      </v-flex>
      <v-flex
        md5
        xs12
        :pa-3="!isMobile"
      >
        <v-text-field
          v-if="isSearchBoxVisible"
          v-model="filterText"
          solo
          clearable
          hide-details
          append-icon="search"
          class="button__searchbox"
          @input="filterSubtitle"
        />
        <div
          :class="[{'flex-container--mobile':isMobile},{'flex-container':!isMobile}]"
        >
          <v-layout
            ref="scrollableSubLayout"
            :pt-2="!isMobile"
            :px-2="isMobile"
            row
            align-content-start
            align-start
            wrap
            class="flex-scrollable"
          >
            <simple-voice-card
              v-for="item in filteredSubtitles"
              :id="item[5]"
              :key="item[5]"
              :ref="item[5]"
              :class="[{'simple-voice-card-margin--mobile':isMobile}, {'ma-1':!isMobile}]"
              :start="Number(item[0])"
              :end="(Number(item[1])*1000 + Number(item[0])*1000) / 1000"
              :text="item[2]"
              :selected-id="selectedId"
              @btnClicked="onVoiceBtnClicked"
            />
          </v-layout>
        </div>
      </v-flex>
      <portal-target name="destination" />
    </v-layout>
  </div>
</template>

<script>
import SimpleVoiceCard from '~/components/SimpleVoiceCard.vue'
import NotificationSnackbar from "~/components/NotificationSnackbar.vue"
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import VueClipboard from 'vue-clipboard2'
import AsyncLock from "async-lock";
import VueScrollTo from "vue-scrollto";
import PortalVue from 'portal-vue'

Vue.use(PortalVue)
Vue.use(VueScrollTo, {
  container: ".flex-scrollable",
  duration: 500,
  easing: "ease",
  offset: -100,
  force: true,
  cancelable: true,
  onStart: false,
  onDone: false,
  onCancel: false,
  x: false,
  y: true
})
Vue.use(VueYoutube)
Vue.use(VueClipboard)

const lock = new AsyncLock();
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

export default {
  watchQuery: [],
  components: {
    NotificationSnackbar,
    SimpleVoiceCard
  },
  data() {
    return {
      subtitles: [],
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
      shareUrl: "",
      isAsr: false,
      isPartial: false,
      showsAsr: false,
      hiddenSubtitles: [],
      canEdit: false,
      captionStatus: "",
      isSearchBoxVisible: true,
      mobileSearchMenu: false
    }
  },
  async asyncData({ params, query, error, $axios }) {
    console.log("asyncData");
    let selectedText = "未選択";
    let selectedId = "";
    const start = Number(query.start);
    const end = Number(query.end);

    const resVideo = await $axios.$post("/api/video", {
      id: params.videoId,
      type: "video"
    }).catch(e => {
      return e.response;
    });
    if (resVideo.status !== 200) {
      error("aa");
    }

    let subtitles = (await $axios.$post("/api/subtitle", { id: params.videoId, type: "video" })).items;

    const captionStatus = resVideo.items[6];
    const isAsr = captionStatus.includes("asr");
    const subtitlesAsr = isAsr ? (await $axios.$post("/api/subtitle/asr", { id: params.videoId, type: "video" })).items : [];

    const isPartial = captionStatus.includes("partial");
    const showsAsr = query.show === "asr"
    let filteredSubtitles;
    let hiddenSubtitles;
    if (isPartial && !showsAsr || !isAsr) {
      filteredSubtitles = subtitles;
      hiddenSubtitles = subtitlesAsr;
    } else {
      hiddenSubtitles = subtitles;
      subtitles = subtitlesAsr;
      filteredSubtitles = subtitlesAsr;
    }

    for (const element of subtitles) {
      if (start == Number(element[0]) && end == (Number(element[1]) * 1000 + Number(element[0]) * 1000) / 1000) {
        selectedText = element[2];
        selectedId = element[5];
        break;
      }
    }

    let videoUrl;
    const videoId = resVideo.items[1];
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
    shareUrl += showsAsr ? "&show=asr" : "";

    return {
      subtitles: subtitles,
      filteredSubtitles: filteredSubtitles,
      hiddenSubtitles: hiddenSubtitles,
      channelId: resVideo.items[0],
      videoId: videoId,
      publishedAt: resVideo.items[2],
      videoTitle: resVideo.items[3],
      videoDescription: resVideo.items[4],
      start: start,
      end: end,
      videoUrl: videoUrl,
      shareUrl: shareUrl,
      selectedText: selectedText,
      selectedId: selectedId,
      isAsr: isAsr,
      isPartial: isPartial,
      showsAsr: showsAsr,
      canEdit: ["editable", "not_permitted"].some(e => captionStatus.includes(e)),
      captionStatus: captionStatus
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
    showsAsr(showsAsr) {
      this.$router.replace({ query: showsAsr ? { show: "asr" } : {} });
      const temp = this.subtitles;
      this.subtitles = this.hiddenSubtitles;
      this.hiddenSubtitles = temp;
      this.filterSubtitle();
      this.selectedId = "";
      this.start = null;
      this.end = null;
      this.selectedText = "未選択";
      this.videoUrl = `https://youtu.be/${this.videoId}`;
      this.shareUrl = `${location.protocol}//${location.host}/video/${this.videoId}${showsAsr ? "?show=asr" : ""}`;
    },
    isMobile(val) {
      if (val) {
        this.$refs.scrollableSubLayout.removeEventListener("wheel", this.onScroll);
      } else {
        this.$refs.scrollableSubLayout.addEventListener("wheel", this.onScroll);
      }

      this.isSearchBoxVisible = !val;
    }
  },
  mounted() {
    if (this.selectedId) {
      this.$scrollTo(this.$refs[this.selectedId][0].$el);
    }

    if (this.isMobile) {
      this.isSearchBoxVisible = false;
    } else {
      this.$refs.scrollableSubLayout.addEventListener("wheel", this.onScroll);
    }

    this.repeat();
  },
  async beforeDestroy() {
    this.$refs.scrollableSubLayout.removeEventListener("wheel", this.onScroll);
  },
  destroyed() {
    this.destroyed = true;
  },
  methods: {
    onScroll(event) {
      const el = this.$refs.scrollableSubLayout;
      if (el.scrollTop === 0 && event.deltaY < 0 ||
        Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)) <= 1 &&
        event.deltaY > 0) {
        event.preventDefault()
      }
    },
    async onVoiceBtnClicked(id, start, end, text) {
      const query = { start: start, end: end }
      if (this.showsAsr) {
        query.show = "asr";
      }
      this.$router.replace({ query: query });
      this.$refs.youtube.player.seekTo(start, true);
      this.selectedId = id;
      this.start = start;
      this.end = end;
      this.selectedText = text;
      this.videoUrl = `https://youtu.be/${this.videoId}?start=${Math.floor(start)}&end=${Math.ceil(end)}`;
      this.shareUrl = `${location.protocol}//${location.host}/video/${this.videoId}?start=${start}&end=${end}${this.showsAsr ? "&show=asr" : ""}`;

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
      this.$refs.notificationSnackbar.showSuccessSnackbar("クリップボードにコピーしました", 3000);
    },
    onCopyError() {
      this.$refs.notificationSnackbar.showErrorSnackbar("コピーに失敗しました", 3000);
    },
    openVideoInNewTab() {
      window.open(this.videoUrl);
      this.$refs.youtube.player.pauseVideo();
    },
    openTwitterSharePage() {
      window.open(`https://twitter.com/share?url=${encodeURIComponent(this.shareUrl)}&text=${encodeURIComponent(this.decodeHTML((this.selectedText + ' - ' + this.videoTitle).replace(/\r?\n/g, ' ')))}&hashtags=dotlive_button`);
      this.$refs.youtube.player.pauseVideo();
    },
    onEditButtonClicked() {
      this.$router.push({ path: `/edit/caption/${this.videoId}`, query: { status: this.captionStatus } });
    },
    async sendPlayCount() {
      if (!this.selectedId || lock.isBusy(`${this.start}${this.end}${this.selectedText}`)) {
        return;
      }

      await lock.acquire(`${this.start}${this.end}${this.selectedText}`, async () => {
        if ((this.showsAsr && this.isPartial) || (this.isAsr && !this.isPartial)) {
          this.$axios({
            method: "POST",
            url: "/api/update/count/asr",
            progress: false,
            data: {
              items: [{ count: 1, id: Number(this.selectedId) }]
            }
          });
        } else {
          this.$axios({
            method: "POST",
            url: "/api/update/count",
            progress: false,
            data: {
              items: [{ start: this.start, end: this.end, text: this.selectedText, videoId: this.videoId, count: 1 }]
            }
          });
        }
        await sleep(Math.max((this.end - this.start) * 1000 - 200, 0));
      });
    },
    decodeHTML(str) {
      return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, '\'').replace(/&#044;/g, ',').replace(/&amp;/g, '&');
    },
    async onSelectCurrentTimeButtonClicked() {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      const targetIndex = this.subtitles.findIndex(e => Number(e[0]) <= currentTime && currentTime < (Number(e[0]) * 1000 + Number(e[1]) * 1000) / 1000);
      if (targetIndex === -1) {
        return;
      }

      const target = this.subtitles[targetIndex];
      this.onVoiceBtnClicked(target[5], Number(target[0]), (Number(target[0]) * 1000 + Number(target[1]) * 1000) / 1000, target[2]);
      this.$scrollTo(this.$refs[target[5]][0].$el);
    }
  },
}
</script>

<style>
.flex-container {
  height: calc(100vh - 150px);
}
.flex-container--mobile {
  height: calc(55vh);
}
.flex-scrollable {
  overflow-y: scroll;
  height: 100%;
}
.video-description {
  word-break: break-word;
  white-space: pre-wrap;
}
.video-description-hidden {
  display: -webkit-box;
  /* autoprefixer: off */
  -webkit-box-orient: vertical;
  /* autoprefixer: on */
  -webkit-line-clamp: 3;
  overflow: hidden;
}
.small-button {
  margin: 0 0 0 8px;
  min-width: 32px;
  padding: 0 12px;
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
.clipboard .v-text-field {
  margin-top: 0;
  padding-top: 0;
}
.clipboard .v-text-field input {
  padding: 2px 0 8px;
}
.v-swich--show-asr {
  margin-left: 10px;
}
.v-swich--show-asr .v-messages {
  min-height: 0;
}
.v-swich--show-asr .v-input__slot {
  margin-bottom: 0;
}
.v-swich--show-asr.v-input--selection-controls:not(.v-input--hide-details)
  .v-input__slot {
  margin-bottom: 0;
}
.v-swich--show-asr.v-input--selection-controls {
  margin-top: 0;
}
.button--edit {
  margin: 0 0 0 6px;
  height: 32px;
  padding: 0 8px;
}
.simple-voice-card-margin--mobile {
  margin: 2px;
}
.search-button--mobile.v-btn {
  height: 32px;
  margin: 0;
}
.mobile-toolbar {
  background-color: #424242;
}
</style>