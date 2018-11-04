<template>
  <v-layout
    v-if="dialog"
    row
    justify-center
  >
    <v-dialog
      v-model="dialog"
      width="60vw"
      scrollable
      @keydown.esc="dialog = false"
    >
      <v-card>
        <v-toolbar
          height="36px"
          flat
        >
          <v-btn-toggle
            v-model="isLoop"
            class="transparent"
          >
            <v-tooltip bottom>
              <v-btn
                slot="activator"
                :value="true"
                flat>
                <v-icon>loop</v-icon>
              </v-btn>
              <span>リピート再生する</span>
            </v-tooltip>
          </v-btn-toggle>
          <v-spacer/>
          <v-btn
            left
            icon
            @click="dialog = false">
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
            />
          </v-responsive>
          <v-card-title>
            <div>
              <span class="grey--text">{{ publishedAt }}</span><br>
              <span>{{ title }}</span><br>
              <div :style="{marginTop:'3px'}">
                <span class="grey--text"> 内容 </span><br>
                <span>{{ text }}</span><br>
                <div :style="{marginTop:'3px'}">
                  <span class="grey--text"> URL </span><br>
                </div>
              </div>
            </div>
          </v-card-title>
          <v-card-actions class="clipboard">
            <v-text-field
              :value="shareUrl"
              readonly
              hide-details
              @focus="$event.target.select()"
            />
            <v-tooltip top>
              <v-btn
                v-clipboard:copy="shareUrl"
                v-clipboard:success="onCopy"
                v-clipboard:error="onCopyError"
                slot="activator"
                depressed
                class="small-button"
              >
                <v-icon
                  small>
                  file_copy
                </v-icon>
              </v-btn>
              <span>URLをクリップボードに貼り付ける</span>
            </v-tooltip>
            <v-tooltip top>
              <v-btn
                slot="activator"
                depressed
                class="small-button"
                @click="openVideoInNewTab"
              >
                <v-icon
                  small>
                  movie
                </v-icon>
              </v-btn>
              <span>YouTubeで開く</span>
            </v-tooltip>
            <v-tooltip
              top>
              <v-btn
                slot="activator"
                :to="`/video/${videoId}?start=${start}&end=${end}`"
                class="small-button"
                depressed
              >
                <v-icon
                  small>
                  open_in_new
                </v-icon>
              </v-btn>
              <span>動画ページを開く</span>
            </v-tooltip>
          </v-card-actions>
          <div
            class="subscribe">
            <script src="https://apis.google.com/js/platform.js" />
            <div
              :data-channelid="channelId"
              class="g-ytsubscribe"
              data-layout="full"
              data-theme="dark"
              data-count="default"/>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar
      v-model="snackbar"
      :timeout="2000"
      top
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-layout>

</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import VueClipboard from 'vue-clipboard2'
import axios from "axios"

Vue.use(VueYoutube)
Vue.use(VueClipboard)

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
      snackbar: false,
      snackbarText: "",
      isLoop: true,
      player_vars: { start: Math.floor(this.start), rel: 0 },
      youTubeUrl: `https://youtu.be/${this.videoId}?start=${Math.floor(this.start)}&end=${Math.ceil(this.end)}`,
      shareUrl: `${location.protocol}//${location.host}/video/${this.videoId}?start=${this.start}&end=${this.end}`
    };
  },
  watch: {
    dialog(value) {
      if (value) {
        this.render = !this.render;
      } else {
        //youtubeのフレームをDOMから削除する
        this.$refs.youtube.player.destroy();
      }
    },
    async isLoop(value) {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      if (value &&
        (currentTime <= this.start ||
          this.end <= currentTime)) {
        this.$refs.youtube.player.seekTo(this.start, true);
      }
    }
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
          if (currentTime > this.end) {
            this.$refs.youtube.player.seekTo(this.start, true);
          }
        }

        setTimeout(loop.bind(this), 50);
      };
      loop.bind(this)();
    },
    open: async function () {
      await axios.post(`/api/video`,
        {
          id: this.videoId,
          type: "video"
        }).then(result => {
          this.channelId = result.data.items[0];
          this.publishedAt = new Date(result.data.items[2]).toLocaleString();
          this.title = result.data.items[3];
          this.dialog = true;
        });
    },
    close() {
      this.dialog = false;
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
      window.open(this.youTubeUrl);
      this.$refs.youtube.player.pauseVideo();
    }
  }
};
</script>

<style>
.video {
  height: calc(60vw * 9 / 16);
  width: calc(60vh * 16 / 9);
  max-width: 60vw;
  max-height: 60vh;
  position: absolute;
  margin: auto;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
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
.subscribe {
  padding: 0 20px;
  height: 65px;
  margin-top: 5px;
}
.small-button {
  margin-left: 8px !important;
  min-width: auto !important;
}
</style>

