<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="8000"
      top
    >
      {{ snackbarText }}
      <v-btn
        dark
        flat
        @click="snackbar = false"
      >
        閉じる
      </v-btn>
    </v-snackbar>
    <v-snackbar
      v-model="errorSnackbar"
      :timeout="8000"
      color="error"
      top
    >
      {{ snackbarText }}
      <v-btn
        dark
        flat
        @click="() => {
          $refs.recycleScroller.scrollToItem(errorIndex);
          errorSnackbar = false;
        }"
      >
        該当箇所に移動
      </v-btn>
    </v-snackbar>
    <v-dialog
      v-model="progressDialog"
      persistent
      max-width="300px"
    >
      <v-card>
        <v-card-text>
          アップロード中
          <v-progress-linear
            class="mb-0"
            color="white"
            indeterminate
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="notificationDialog"
      max-width="420px"
      persistent
    >
      <v-card>
        <v-card-text>
          <ul>
            <li
              v-for="(text, index) in notificationDialogTextaList"
              :key="index"
              style="margin-top:10px"
            >
              <strong>
                {{ text }}
              </strong>
            </li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            flat="flat"
            @click="notificationDialog = false"
          >
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="confirmDialog"
      max-width="300px"
    >
      <v-card>
        <v-card-text>{{ confirmDialogText }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            flat
            @click="confirmDialog = false"
          >
            キャンセル
          </v-btn>
          <v-btn
            :color="confirmDialogAceeptButtonColor"
            @click="() => {
              confirmDialog = false;
              confirmDialogAcceptFunction()
            }"
          >
            {{ confirmDialogAcceptText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <input
      v-show="false"
      ref="pickFile"
      accept=".srt"
      name="caption"
      type="file"
      @change="onSubRipFilePicked"
    >
    <v-toolbar
      height="36px"
      flat
    >
      <v-layout
        row
        align-center
        wrap
      >
        <v-tooltip bottom>
          <v-chip
            slot="activator"
            class="connectionCount"
            disabled
            :color="connectionCount === 1 ? 'grey darken-4': 'red'"
            text-color="white"
            label
          >
            <v-avatar>
              <v-icon>account_circle</v-icon>
            </v-avatar>
            {{ connectionCount }}人がこのページを見ています
          </v-chip>
          <span>2人以上いる場合、重複して編集している可能性があるので注意してください</span>
        </v-tooltip>
        <v-spacer />
        <v-menu
          bottom
          left
        >
          <v-btn
            slot="activator"
            dark
            icon
          >
            <v-icon>more_vert</v-icon>
          </v-btn>
          <v-list>
            <v-list-tile @click="showPickSubRipFileDialog">
              <v-list-tile-avatar>
                <v-icon>insert_drive_file</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-title>SubRipファイルを読み込む</v-list-tile-title>
            </v-list-tile>
            <v-list-tile @click="downloadSubRip">
              <v-list-tile-avatar>
                <v-icon>get_app</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-title>SubRipファイルを保存</v-list-tile-title>
            </v-list-tile>
            <v-list-tile @click="uploadButtonClicked">
              <v-list-tile-avatar>
                <v-icon>cloud_upload</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-title>字幕をアップロード</v-list-tile-title>
            </v-list-tile>
            <v-list-tile @click="deleteAllButtonClicked">
              <v-list-tile-avatar>
                <v-icon color="red">
                  delete_forever
                </v-icon>
              </v-list-tile-avatar>
              <v-list-tile-title>字幕をすべて削除する</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </v-layout>
    </v-toolbar>
    <v-layout
      :pa-4="!isMobile"
      :pa-1="isMobile"
      justify-center
      row
    >
      <v-flex
        :px-5="!isMobile"
        xs7
      >
        <v-responsive
          :key="videoId"
          :aspect-ratio="16/9"
          class="pb-3"
        >
          <youtube
            ref="youtube"
            :video-id="videoId"
            height="100%"
            width="100%"
            @paused="videoPaused"
            @playing="playingVideo"
          />
          <p class="subtitle__text">
            <span
              v-if="displaySubtitle"
              class="subtitle__background"
            >
              {{ displaySubtitle }}
            </span>
          </p>
        </v-responsive>
        <v-layout
          justify-center
          row
          wrap
          pb-2
        >
          <v-btn
            class="small-button mx-2"
            depressed
            @click="seekVideo(-5)"
          >
            <v-icon>replay_5</v-icon>
          </v-btn>
          <v-btn
            class="small-button mx-2"
            depressed
            @click="seekVideo(-1)"
          >
            <v-icon>
              chevron_left
            </v-icon>
          </v-btn>
          <v-btn
            class="small-button mx-2"
            depressed
            @click="onPlayButtonClicked"
          >
            <v-icon>{{ playIcon }}</v-icon>
          </v-btn>
          <v-btn
            class="small-button mx-2"
            depressed
            @click="seekVideo(1)"
          >
            <v-icon>
              chevron_right
            </v-icon>
          </v-btn>
          <v-btn
            class="small-button mx-2"
            depressed
            @click="seekVideo(5)"
          >
            <v-icon>forward_5</v-icon>
          </v-btn>
        </v-layout>
        <v-layout
          v-if="selectedId !== -1"
          align-center
          row
          wrap
        >
          <v-flex
            md6
            xs12
          >
            <v-btn
              class="pa-1"
              @click="playFromSelectedStart"
            >
              <v-icon left>
                play_arrow
              </v-icon>編集中の開始時間から再生
            </v-btn>
          </v-flex>
          <v-flex
            md6
            xs12
            py-1
            pl-1
          >
            <v-switch
              v-model="loop"
              class="repeat-checkbox"
              color="#1976d2"
              label="編集位置をリピート"
            />
          </v-flex>
          <v-flex
            md6
            xs12
          >
            <v-layout align-center>
              <v-btn @click="setCurrentTimeToStart">
                現在の時間
              </v-btn>
              <v-flex xs6>
                <v-text-field
                  :value="selectedStart"
                  class="start-end-time-textfield"
                  label="開始時間（秒）"
                  type="number"
                  @input="formatStartTime"
                />
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex
            md6
            xs12
          >
            <v-layout>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedStart(-1)"
              >
                -1
              </v-btn>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedStart(-0.1)"
              >
                -0.1
              </v-btn>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedStart(0.1)"
              >
                +0.1
              </v-btn>

              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedStart(1)"
              >
                +1
              </v-btn>
            </v-layout>
          </v-flex>
          <v-flex
            md6
            xs12
          >
            <v-layout align-center>
              <v-btn @click="setCurrentTimeToEnd">
                現在の時間
              </v-btn>
              <v-flex xs6>
                <v-text-field
                  class="start-end-time-textfield"
                  :value="selectedEnd"
                  label="終了時間（秒）"
                  type="number"
                  @input="formatEndTime"
                />
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex
            md6
            xs12
          >
            <v-layout>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedEnd(-1)"
              >
                -1
              </v-btn>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedEnd(-0.1)"
              >
                -0.1
              </v-btn>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedEnd(0.1)"
              >
                +0.1
              </v-btn>
              <v-btn
                :class="{'small-button mx-1':isMobile}"
                @click="changeSelectedEnd(1)"
              >
                +1
              </v-btn>
            </v-layout>
          </v-flex>
          <v-flex xs12>
            <v-textarea
              v-model="selectedSubtitle"
              auto-grow
              flat
              label="字幕"
              rows="2"
            />
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex
        :pr-5="!isMobile"
        xs5
      >
        <div class="subtitle-container">
          <v-layout
            justify-start
            row
            wrap
          >
            <v-btn @click="addSubtitleCard">
              字幕を追加
            </v-btn>
            <v-tooltip
              open-delay="500"
              style="height:auto;"
              bottom
            >
              <v-btn
                slot="activator"
                :block="isMobile"
                @click="addSubtitleCardFromAsr"
              >
                <span style="white-space: normal;">
                  再生位置にある自動生成字幕を追加
                </span>
              </v-btn>
              <span>YouTubeの字幕表示と合わせて使用すると良いです。YouTubeの字幕はドラッグで移動できます。</span>
            </v-tooltip>
          </v-layout>
          <v-radio-group
            v-model="selectedId"
            class="edit-caption-container"
          >
            <v-layout
              class="subtitle-container"
              column
            >
              <recycle-scroller
                ref="recycleScroller"
                :key="selectedSubtitleVer"
                :items="subtitleList"
                :item-height="86"
                style="height:100%"
              >
                <subtitle-card
                  :id="item.id"
                  :key="item.id"
                  :ref="item.id"
                  slot-scope="{ item }"
                  :end="item.end"
                  :prop-has-error="item.hasError"
                  :selected-id="selectedId"
                  :start="item.start"
                  :text="item.text"
                  @subtitleCardCloseEvent="onSubtitleCardClosed"
                  @subtitleCardSelectedEvent="onSubtitleCardSelected"
                />
              </recycle-scroller>
            </v-layout>
          </v-radio-group>
        </div>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import SubtitleCard from "~/components/SubtitleCard.vue"
import download from "downloadjs"
import parseSRT from 'parse-srt'
import { RecycleScroller } from 'vue-virtual-scroller'
import io from 'socket.io-client'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

Vue.use(VueYoutube)

export default {
  components: {
    SubtitleCard,
    RecycleScroller,
  },
  data() {
    return {
      videoId: null,
      loop: false,
      playIcon: "play_arrow",
      selectedId: -1,
      preSelectedId: -1,
      selectedStart: 0,
      selectedEnd: 0,
      selectedSubtitle: "",
      selectedSubtitleVer: 1,
      destroyed: false,
      subtitleList: [],
      displaySubtitle: "",
      currentTime: 0,
      snackbar: false,
      snackbarText: "",
      snackbarColor: "",
      progressDialog: false,
      notificationDialog: false,
      notificationDialogTextaList: [],
      confirmDialog: false,
      confirmDialogText: "",
      confirmDialogAcceptText: "",
      confirmDialogAcceptFunction: null,
      confirmDialogAceeptButtonColor: "green darken-1",
      errorSnackbar: false,
      errorIndex: -1,
      socket: "",
      connectionCount: 1,
      existsCaptionOnServer: false
    }
  },
  async asyncData({ params, query, $axios }) {
    const res = await $axios.$post("/api/edit/subtitle/get", { videoId: params.videoid });
    const subtitleList = [];
    let existsCaptionOnServer = false;
    if (res.items.length > 0) {
      existsCaptionOnServer = true;
      for (let i = 0; i < res.items.length; i++) {
        const end = (Number(res.items[i][0]) * 1000 + Number(res.items[i][1]) * 1000) / 1000
        subtitleList.push({ id: i, start: res.items[i][0], end: end, text: res.items[i][2] });
      }
    }

    return {
      videoId: params.videoid,
      subtitleList: subtitleList,
      existsCaptionOnServer: existsCaptionOnServer
    }
  },
  computed: {
    isMobile() {
      return ["xs", "sm"].some(e => {
        return this.$vuetify.breakpoint.name === e;
      });
    }
  },
  watch: {
    async selectedId(val) {
      if (this.preSelectedId !== -1) {
        try {
          this.$refs[this.preSelectedId].select(false);
        } catch (e) { console.log(e) };
      }

      if (val === -1) {
        this.preSelectedId = -1;
        return;
      }

      this.preSelectedId = val;

      let selectedItem = this.$refs[val];
      let count = 0;
      while (!selectedItem && count < 5) {
        console.log("retry");
        await sleep(300);
        selectedItem = this.$refs[val];
        count++;
      }

      if (!selectedItem) {
        return;
      }

      selectedItem.select(true);

      const [id, start, end, text] = selectedItem.getData();
      this.selectedStart = start;
      this.selectedEnd = end;
      this.selectedSubtitle = text;
    },
    selectedSubtitle(val) {
      this.$refs[this.selectedId].setSubtitle(val);
      this.subtitleList.find(e => e.id === this.selectedId).text = val;
    }
  },
  destroyed() {
    this.socket.disconnect();
    this.destroyed = true;
  },
  created() {
    const messageList = [];
    if (this.$route.query.status.includes("editable")) {
      messageList.push("重複して編集してしまう可能性があるので、YouTubeに編集中の字幕がないか確認してください");
    }

    this.showNotificationDialog(messageList);
  },
  mounted() {
    this.socket = io();
    this.socket.on("connectionCount", message => {
      this.connectionCount = message.connectionCount;
    })
    this.socket.emit("join", { id: this.videoId });

    async function loop() {
      if (this.destroyed) {
        return;
      }

      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      this.currentTime = Math.floor(currentTime * 1000) / 1000;
      const result = this.subtitleList.find(e => e.start <= currentTime && currentTime <= e.end);
      if (result) {
        this.displaySubtitle = result.text;
      } else {
        this.displaySubtitle = "";
      }

      if (this.loop) {
        if (currentTime < this.selectedStart || this.selectedEnd < currentTime) {
          this.$refs.youtube.player.seekTo(this.selectedStart, true);
        }
      }

      setTimeout(loop.bind(this), 100);
    };
    loop.bind(this)();
  },
  methods: {
    addSubtitleCard() {
      const id = Math.max(...this.subtitleList.map(e => e.id), 0) + 1;
      if (this.subtitleList.length === 0) {
        this.subtitleList.push({ id: id, start: 0, end: 2, text: "", hasError: false });
      } else {
        const start = this.subtitleList[this.subtitleList.length - 1].end;
        const end = start + 2;
        this.subtitleList.push({ id: id, start: start, end: end, text: "", hasError: false });
      }

      this.$nextTick(() => {
        this.$refs.recycleScroller.scrollToItem(this.subtitleList.length - 1);
        this.selectedId = id;
      });
    },
    async addSubtitleCardFromAsr() {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      try {
        const item = (await this.$axios.$post("/api/edit/subtitle/get/asr", { videoId: this.videoId, sec: currentTime })).item;
        if (!item) {
          return;
        }

        const id = Math.max(...this.subtitleList.map(e => e.id), 0) + 1;
        const start = Number(item.start);
        const end = Math.floor(start * 1000 + Number(item.dur) * 1000) / 1000;
        this.subtitleList.push({ id: id, start: start, end: end, text: item.text, hasError: false });

        this.sortAndCheckOrder();
        this.selectedId = id;
      } catch (e) {
        console.log(e);
        this.showErrorSnackbar("該当する字幕がありません");
      }
    },
    onSubtitleCardSelected(id) {
      this.selectedId = id;
    },
    onSubtitleCardClosed(id) {
      this.subtitleList = this.subtitleList.filter(e => e.id != id);
      this.selectedId = -1;
    },
    async setCurrentTimeToStart() {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      this.formatStartTime(currentTime);
    },
    async setCurrentTimeToEnd() {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      this.formatEndTime(currentTime);
    },
    playingVideo() {
      this.playIcon = "pause";
    },
    videoPaused() {
      this.playIcon = "play_arrow";
    },
    formatStartTime(val) {
      const tempTime = Math.floor(Number(val) * 1000) / 1000;
      if (tempTime > this.selectedEnd) {
        this.$nextTick(() => {
          this.selectedEnd = tempTime;
          this.subtitleList.find(e => e.id === this.selectedId).end = tempTime;
          this.$refs[this.selectedId].setEnd(tempTime);
        });
      }

      this.$nextTick(() => {
        this.selectedStart = tempTime;
        this.subtitleList.find(e => e.id === this.selectedId).start = this.selectedStart;
        this.$refs[this.selectedId].setStart(this.selectedStart);
        this.sortAndCheckOrder();
      });
    },
    formatEndTime(val) {
      const tempTime = Math.ceil(Number(val) * 1000) / 1000;
      let newEndTime;
      if (tempTime < this.selectedStart) {
        newEndTime = this.selectedStart;
      } else {
        newEndTime = tempTime;
      }

      this.$nextTick(() => {
        this.selectedEnd = newEndTime;
        this.subtitleList.find(e => e.id === this.selectedId).end = this.selectedEnd;
        this.$refs[this.selectedId].setEnd(this.selectedEnd);
        this.sortAndCheckOrder();
      });
    },
    sortAndCheckOrder() {
      this.errorSnackbar = false;

      this.subtitleList.sort((a, b) => {
        if (a.start > b.start) {
          return 1;
        } else if (a.start < b.start) {
          return -1;
        } else {
          if (a.end > b.end) {
            return 1;
          } else if (a.end < b.end) {
            return -1;
          } else {
            return 0;
          }
        }
      });

      this.$nextTick(() => {
        const selectedItemIndex = this.subtitleList.findIndex(e => e.id === this.selectedId);
        if (selectedItemIndex !== -1) {
          this.$refs.recycleScroller.scrollToItem(selectedItemIndex);
        }
      });

      for (let i = 0; i < this.subtitleList.length; i++) {
        const target = this.subtitleList[i];
        const oneBefore = this.subtitleList[i - 1];

        if (i > 0 && oneBefore.end > target.start) {
          target.hasError = true;
          if (this.$refs[target.id]) {
            this.$refs[target.id].error(true);
          }
          oneBefore.hasError = true;
          if (this.$refs[oneBefore.id]) {
            this.$refs[oneBefore.id].error(true);
          }

          if (!this.errorSnackbar) {
            this.showSubtitleListErrorSnackbar("時間が重なっています", i - 1);
          }

          continue;
        }

        if (target.start === target.end) {
          target.hasError = true;
          if (this.$refs[target.id]) {
            this.$refs[target.id].error(true);
          }

          if (!this.errorSnackbar) {
            this.showSubtitleListErrorSnackbar("開始時間と終了時間が同じです", i);
          }

          continue;
        }

        target.hasError = false;
        if (this.$refs[target.id]) {
          this.$refs[target.id].error(false);
        }
      }
    },
    onPlayButtonClicked() {
      if (this.playIcon === "play_arrow") {
        this.$refs.youtube.player.playVideo();
      } else {
        this.$refs.youtube.player.pauseVideo();
      }
    },
    playFromSelectedStart() {
      this.$refs.youtube.player.seekTo(this.selectedStart, true);
      this.$refs.youtube.player.playVideo();
    },
    async seekVideo(diff) {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      this.$refs.youtube.player.seekTo(currentTime + diff, true);
    },
    downloadSubRip() {
      this.subtitleList.forEach((e, i) => {
        if (i === this.subtitleList.length - 1) {
          return;
        }

        if (e.end > this.subtitleList[i + 1].start) {
          e.end = this.subtitleList[i + 1].start;
        }
      });
      const filteredSubtitleList = this.subtitleList.filter(e => e.text && e.text.replace(/\s+/g, "").length >= 1);
      if (filteredSubtitleList.length > 0) {
        let output = "";
        filteredSubtitleList.forEach((subtitle, index) => {
          const startHour = this.zeroPadding(2, Math.floor((subtitle.start / 60) / 60));
          const startMinute = this.zeroPadding(2, Math.floor((subtitle.start / 60) % 60));
          const startSecond = this.zeroPadding(2, Math.floor(subtitle.start % 60));
          const startMilliSec = this.zeroPadding(3, Math.floor((subtitle.start - Math.floor(subtitle.start)) * 1000));
          const start = `${startHour}:${startMinute}:${startSecond},${startMilliSec}`;
          const endHour = this.zeroPadding(2, Math.floor((subtitle.end / 60) / 60));
          const endMinute = this.zeroPadding(2, Math.floor((subtitle.end / 60) % 60));
          const endSecond = this.zeroPadding(2, Math.floor(subtitle.end % 60));
          const endMilliSec = this.zeroPadding(3, Math.floor((subtitle.end - Math.floor(subtitle.end)) * 1000));
          const end = `${endHour}:${endMinute}:${endSecond},${endMilliSec}`;
          output += `${index + 1}\r\n${start} --> ${end}\r\n${subtitle.text}\r\n\r\n`;
        });
        download(output, `字幕_${this.videoId}.srt`, "text/plaing");

        this.showSuccessSnackbar("ダウンロード完了");
      } else {
        this.showErrorSnackbar("字幕を入力してください");
      }
    },
    async uploadSubtitle() {
      this.progressDialog = true;

      if (this.subtitleList.length === 0) {
        this.showErrorSnackbar("字幕がありません");
        this.progressDialog = false;
        return;
      }

      this.sortAndCheckOrder();
      if (this.subtitleList.find(e => e.hasError)) {
        this.progressDialog = false;
        return;
      }

      const errorSubtitleList = this.subtitleList.filter(e => !e.text || e.text.replace(/\s+/g, "").length < 1);
      if (errorSubtitleList.length === 0) {
        let output = [];
        this.subtitleList.forEach((subtitle, index) => {
          output.push([subtitle.start, subtitle.end - subtitle.start, subtitle.text]);
        });

        await this.$axios.$post(`/api/edit/subtitle${this.existsCaptionOnServer ? "/update" : ""}`, {
          videoId: this.videoId,
          items: output
        }).then(res => {
          this.showSuccessSnackbar("アップロード完了");
        }).catch(error => {
          console.log(error.response.data);
          this.showErrorSnackbar(`アップロード失敗${error.response.data.message}`);
        });
      } else {
        errorSubtitleList.forEach(e => {
          e.hasError = true;
          if (this.$refs[e.id]) {
            this.$refs[e.id].error(true);
          }
        });

        this.showSubtitleListErrorSnackbar("字幕を入力してください", errorSubtitleList[0].id);
      }

      this.progressDialog = false;
    },
    zeroPadding(count, target) {
      return ("0".repeat(count) + target).slice(count * -1);
    },
    showPickSubRipFileDialog() {
      if (this.subtitleList.length > 0) {
        this.showConfirmDialog(
          "現在編集中の字幕は上書きされます",
          "詠み込む",
          () => this.$refs.pickFile.click(),
          "red darken-1"
        );
        return;
      }

      this.$refs.pickFile.click();
    },
    onSubRipFilePicked(event) {
      if (event.target.files.length === 0) {
        return;
      }

      const reader = new FileReader();
      reader.readAsText(event.target.files[0]);
      reader.onload = function () {
        try {
          this.$nextTick(() => {
            this.subtitleList = parseSRT(reader.result);
            this.subtitleList.forEach(e => {
              e.text = e.text.replace(/<br \/>/g, "\n");
            })
            this.selectedId = -1;
            this.selectedSubtitleVer++;
            this.sortAndCheckOrder();
          });
        } catch (e) {
          this.showErrorSnackbar("読み込みに失敗しました");
          console.log(e);
        }
      }.bind(this)
    },
    uploadButtonClicked() {
      this.showConfirmDialog(
        "字幕を.LIVEボタンにアップロードします。字幕が承認されるまでアップロードができなくなるので注意してください。",
        "アップロード",
        this.uploadSubtitle,
        "green darken-1"
      );
    },
    deleteAllButtonClicked() {
      this.showConfirmDialog(
        "編集中の字幕をすべて削除します",
        "削除",
        this.deleteAllSubtitle,
        "red darken-1"
      );
    },
    deleteAllSubtitle() {
      this.subtitleList = [];
      this.selectedId = -1;
      this.preSelectedId = -1
      this.selectedStart = 0;
      this.selectedEnd = 0;
      this.selectedSubtitle = "";
    },
    changeSelectedStart(diff) {
      this.selectedStart = (this.selectedStart * 10 + diff * 10) / 10;
      this.formatStartTime(this.selectedStart);
    },
    changeSelectedEnd(diff) {
      this.selectedEnd = (this.selectedEnd * 10 + diff * 10) / 10;
      this.formatEndTime(this.selectedEnd);
    },
    showSuccessSnackbar(message) {
      this.snackbarText = message;
      this.snackbarColor = "success";
      this.snackbar = true;
    },
    showErrorSnackbar(message) {
      this.snackbarText = message;
      this.snackbarColor = "error";
      this.snackbar = true;
    },
    showSubtitleListErrorSnackbar(message, errorIndex) {
      this.errorIndex = errorIndex;
      this.snackbarText = message;
      this.errorSnackbar = true;
    },
    showNotificationDialog(messageList) {
      if (messageList.length === 0) {
        return;
      }

      this.notificationDialogTextaList = messageList;
      this.notificationDialog = true;
    },
    showConfirmDialog(message, acceptButtonText, onAcceptedFunction, acceptButtionColor) {
      this.confirmDialogText = message;
      this.confirmDialogAcceptText = acceptButtonText;
      this.confirmDialogAcceptFunction = onAcceptedFunction;
      this.confirmDialogAceeptButtonColor = acceptButtionColor;
      this.confirmDialog = true;
    }
  }
}
</script>

<style>
.subtitle-container {
  height: calc(100vh - 170px - 38px);
}
.subtitle-container .v-input--selection-controls {
  margin-top: 2px;
}
.subtitle-container .v-btn {
  margin-top: 0;
}
.edit-caption-container.v-input--selection-controls .v-input__control {
  flex-grow: 1;
}
.subtitle__text {
  z-index: 3;
  position: absolute;
  font-size: 18px;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 0 20px;
  word-wrap: break-word;
  text-align: center;
  pointer-events: none;
}
.subtitle__background {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
}
.small-button {
  margin-left: 0 !important;
  min-width: auto !important;
  margin: 0;
}
.connectionCount.v-chip {
  margin: 0;
}
.repeat-checkbox.v-input--selection-controls {
  margin-top: 0;
}
.repeat-checkbox .v-messages {
  min-height: 0;
}
.start-end-time-textfield .v-messages {
  min-height: 0;
}
</style>

