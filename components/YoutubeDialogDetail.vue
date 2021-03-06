<template>
  <v-layout
    v-if="dialog"
    row
    justify-center
  >
    <v-dialog
      v-model="dialog"
      :width="isMobile ? '100vw' : '60vw'"
      :content-class="isMobile ? 'ma-0' : ''"
      scrollable
      @keydown.esc="dialog = false"
    >
      <v-card>
        <v-toolbar
          height="36px"
          flat
        >
          <v-spacer />
          <v-btn
            left
            icon
            @click="dialog = false"
          >
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text style="padding:0">
          <v-responsive :aspect-ratio="16/9">
            <youtube
              ref="youtube"
              :video-id="videoId"
              :player-vars="player_vars"
              width="100%"
              height="100%"
              @ready="readyVideo"
              @playing="playingVideo"
            />
          </v-responsive>
          <v-btn-toggle
            v-model="isLoop"
            style="margin-left:20px"
          >
            <v-btn
              :value="true"
              depressed
              color="blue darken-2"
            >
              <v-icon>loop</v-icon>
              <span>リピート</span>
            </v-btn>
          </v-btn-toggle>
          <v-card-title>
            <div>
              <span class="grey--text">
                {{ publishedAt }}
              </span><br>
              <span v-html="title" /><br>
              <div :style="{marginTop:'3px'}">
                <span class="grey--text">
                  内容
                </span><br>
                <span v-html="text" /><br>
                <div
                  v-if="!isMobile"
                  :style="{marginTop:'3px'}"
                >
                  <span class="grey--text">
                    URL
                  </span><br>
                </div>
              </div>
            </div>
          </v-card-title>
          <v-card-actions
            style="margin-bottom: 20px"
            class="clipboard"
          >
            <v-text-field
              v-if="!isMobile"
              :value="shareUrl"
              readonly
              hide-details
              @focus="$event.target.select()"
            />
            <v-tooltip top>
              <v-btn
                slot="activator"
                :to="`/video/${videoId}?start=${start}&end=${end}${isAsr ? '&show=asr' :''}`"
                class="small-button"
                depressed
              >
                <v-icon small>
                  open_in_new
                </v-icon>
              </v-btn>
              <span>動画ページを開く</span>
            </v-tooltip>
            <v-tooltip top>
              <v-btn
                slot="activator"
                depressed
                color="#FF0000"
                class="small-button"
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
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import AsyncLock from "async-lock";

Vue.use(VueYoutube)

const lock = new AsyncLock();
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

export default {
  props: {
    videoId: {
      type: String,
      required: true
    },
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      dialog: false,
      //youtubeをダイアログが開いたときに読み込むようにする
      render: false,
      title: "",
      publishedAt: "",
      channelId: "",
      isLoop: true,
      player_vars: { start: Math.floor(this.start), rel: 0 },
      youTubeUrl: `https://youtu.be/${this.videoId}?start=${Math.floor(this.start)}&end=${Math.ceil(this.end)}`,
      shareUrl: "",
      isFirstPlay: true,
      isAsr: false
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
    async dialog(value) {
      if (value) {
        this.render = !this.render;
      } else {
        //youtubeのフレームをDOMから削除する
        this.$refs.youtube.player.destroy();
      }
    },
  },
  methods: {
    readyVideo() {
      this.$refs.youtube.player.seekTo(this.start, true);

      async function loop() {
        if (!this.dialog) {
          return;
        }

        if (this.isLoop) {
          const currentTime = await this.$refs.youtube.player.getCurrentTime();
          if (!this.isFirstPlay && (currentTime < this.start || this.end < currentTime)) {
            this.$refs.youtube.player.seekTo(this.start, true);
            await this.sendPlayCount();
          }
        }

        setTimeout(loop.bind(this), 30);
      };
      loop.bind(this)();
    },
    async open(type) {
      await this.$axios.$post(`/api/video`,
        {
          id: this.videoId,
          type: "video"
        }).then(res => {
          this.channelId = res.items[0];
          this.publishedAt = new Date(res.items[2]).toLocaleString();
          this.title = res.items[3];
          this.dialog = true;
          this.isAsr = type === "asr";
          this.shareUrl = `${location.protocol}//${location.host}/video/${this.videoId}?start=${this.start}&end=${this.end}${this.isAsr ? "&show=asr" : ""}`
        });
    },
    close() {
      this.dialog = false;
    },
    openVideoInNewTab() {
      window.open(this.youTubeUrl);
      this.$refs.youtube.player.pauseVideo();
    },
    openTwitterSharePage() {
      window.open(`https://twitter.com/share?url=${encodeURIComponent(this.shareUrl)}&text=${encodeURIComponent(this.decodeHTML((this.text + ' - ' + this.title).replace(/\r?\n/g, ' ')))}&hashtags=dotlive_button`);
      this.$refs.youtube.player.pauseVideo();
    },
    async playingVideo() {
      if (this.isFirstPlay) {
        await this.sendPlayCount();
        this.isFirstPlay = false;
      }
    },
    async sendPlayCount() {
      if (lock.isBusy(`${this.start}${this.end}${this.selectedText}`)) {
        return;
      }

      await lock.acquire(`${this.start}${this.end}${this.selectedText}`, async () => {
        if (this.isAsr) {
          this.$axios({
            method: "POST",
            url: "/api/update/count/asr",
            progress: false,
            data: {
              items: [{ count: 1, id: Number(this.id) }]
            }
          });
        } else {
          this.$axios({
            method: "POST",
            url: "/api/update/count",
            progress: false,
            data: {
              items: [{ start: this.start, end: this.end, text: this.text, videoId: this.videoId, count: 1 }]
            }
          });
        }
        await sleep(Math.max((this.end - this.start) * 1000 - 200, 0));
      });
    },
    decodeHTML(str) {
      return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, '\'').replace(/&#044;/g, ',').replace(/&amp;/g, '&');
    }
  },
};
</script>

<style>
.v-card__title {
  padding: 5px 16px 0 16px;
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
.content__title {
  margin-top: 5px !important;
}
.small-button {
  margin-left: 8px !important;
  min-width: auto !important;
}
</style>

