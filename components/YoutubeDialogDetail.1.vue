<template>
  <div>
    <v-dialog
      v-model="dialog"
      lazy
      width="60vw"
      hieght="auto"
      @keydown.esc="dialog = false"
    >
      <v-card
        :key="render"
      >
        <v-toolbar
          height="40px"
          flat
        >
          <v-btn-toggle
            v-model="isLoop"
            class="transparent"
          >
            <v-btn
              :value="true"
              flat>
              <v-icon>loop</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-spacer/>
          <v-btn
            left
            icon
            @click="dialog = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-responsive :aspect-ratio="16/9">
          <youtube
            ref="youtube"
            :video-id="videoId"
            :player-vars="player_vars"
            width="100%"
            height="100%"
            @ended="videoEnded"
            @ready="readyVideo"
          />
        </v-responsive>
        <v-card-title>
          <div>
            <span class="grey--text">{{ publishedAt }}</span><br>
            <span>{{ title }}</span><br>
          </div>
        </v-card-title>
        <v-card-actions class="clipboard">
          <v-text-field
            :value="`https://youtu.be/${videoId}?start=${start}&end=${end}`"
            label="URL"
            readonly
            @focus="$event.target.select()"
          />
          <v-btn
            v-clipboard:copy="channelId"
            v-clipboard:success="onCopy"
            v-clipboard:error="onCopyError"
            depressed
          >
            <v-icon
              small>
              file_copy
            </v-icon>
          </v-btn>
        </v-card-actions>
        <v-card-text class="subscribe">
          <script src="https://apis.google.com/js/platform.js" />
          <div
            :data-channelid="channelId"
            class="g-ytsubscribe"
            data-layout="full"
            data-theme="dark"
            data-count="default"/>
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
  </div>

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
      player_vars: { start: this.start, end: this.end, rel: 0 }
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
      console.log(`isLoop:${value}`);
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      console.log(`${currentTime}`);
      if (value &&
        (currentTime <= this.start
          || this.end <= currentTime)) {
        console.log("play video");
        this.$refs.youtube.player.seekTo(this.start, true);
        //this.$refs.youtube.player.playVideo();
      }
    }
  },
  methods: {
    readyVideo() {
      if (this.dialog) {
        //ポップアップが開いたら自動再生
        //this.$refs.youtube.player.playVideo();
      }
    },
    videoEnded() {
      if (this.isLoop) {
        this.$refs.youtube.player.seekTo(this.start, true);
      } else {
        this.player_vars = {};
        this.$refs.youtube.player.playVideo();
        this.$refs.youtube.player.seekTo(this.end + 0.1, true);
      }
    },
    open: async function () {
      await axios.get(`${process.env.baseUrl}/video/${this.videoId}`).then(result => {
        this.channelId = result.data.items[0];
        this.publishedAt = new Date(result.data.items[1]).toLocaleString();
        this.title = result.data.items[2];
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
.clipboard {
  margin: 0 20px;
}
.v-card__title {
  padding: 12px 16px 8px 16px;
}
.v-text-field {
  margin-top: 0;
}
.subscribe {
  padding: 0 30px;
  height: 64px;
}
</style>

