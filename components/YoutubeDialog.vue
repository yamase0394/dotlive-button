<template>
  <v-dialog 
    v-model="dialog"
    lazy
    width="0"
    hieght="0"
    @keydown.esc="dialog = false"
  >
    <!-- <v-btn 
      slot="activator" 
      icon>
      <v-icon>play_arrow</v-icon>
    </v-btn> -->
    <v-card
      :key="render"
      flat
      color="transparent"
      class="content">
      <youtube 
        ref="youtube" 
        :video-id="videoId" 
        :player-vars="{ start: start, end: end}"
        width="100%"
        height="100%"
        @ended="dialog = false"
        @ready="readyVideo"
      />
    </v-card>
  </v-dialog>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'

Vue.use(VueYoutube)

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
      //youtubeをダイアログを開いたときに読み込むようにする
      render: false,
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
    }
  },
  methods: {
    readyVideo() {
      if (this.dialog) {
        //ポップアップが開いたら自動再生
        //this.$refs.youtube.player.playVideo();
      }
    },
    open() {
      this.dialog = true;
    },
    close() {
      this.dialog = false;
    }
  }
};
</script>

<style>
.content {
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
</style>

