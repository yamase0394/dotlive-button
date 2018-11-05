<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="8000"
      top>
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
      top>
      {{ snackbarText }}
      <v-btn
        dark
        flat
        @click="() => {
          $refs.dynamicScroller.scrollToItem(errorIndex);
          errorSnackbar = false;
        }"
      >
        該当箇所に移動
      </v-btn>
    </v-snackbar>
    <v-dialog
      v-model="progressDialog"
      persistent
      width="300"
    >
      <v-card>
        <v-card-text>
          アップロード中
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="notifycanEditAtYoutubeDialog"
      persistent
      max-width="290">
      <v-card>
        <v-card-text>この動画の字幕はYouTubeでも編集できます</v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn
            flat="flat"
            @click="notifycanEditAtYoutubeDialog = false"
          >
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="confirmDialog"
      max-width="290">
      <v-card>
        <v-card-text>{{ confirmDialogText }}</v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn
            color="red darken-1"
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
      type="file"
      name="caption"
      @change="onSubRipFilePicked"
    >
    <v-toolbar
      flat
      height="38px">
      <v-toolbar-items>
        <v-tooltip bottom>
          <v-switch
            slot="activator"
            v-model="autoSave"
            label="変更を自動保存"
            color="#1976d2"
          />
          <span> ページを離れても編集が保存されます</span>
        </v-tooltip>
      </v-toolbar-items>
      <v-spacer/>
      <v-toolbar-items>
        <v-btn
          flat
          @click="showPickSubRipFileDialog">
          <v-icon left>
            insert_drive_file
          </v-icon>
          SubRipファイルを読み込む
        </v-btn>
        <v-btn
          flat
          @click="downloadSubRip">
          <v-icon left>
            get_app
          </v-icon>
          SubRipファイルを保存
        </v-btn>
        <v-btn
          :loading="progressDialog"
          flat
          @click="uploadButtonClicked">
          <v-icon left>
            cloud_upload
          </v-icon>
          字幕をアップロード
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-container fluid>
      <v-layout
        justify-space-around
        row>
        <v-flex
          style="max-width:45vw"
          xs7>
          <v-container
            class="padding-0"
            grid-list-md>
            <v-layout
              column>
              <v-flex
                class="flex-grow-0">
                <v-responsive
                  :key="videoId"
                  :aspect-ratio="16/9">
                  <youtube
                    ref="youtube"
                    :video-id="videoId"
                    width="100%"
                    height="100%"
                    @playing="playingVideo"
                    @ready="readyVideo"
                    @error="videoError"
                    @paused="videoPaused"
                  />
                  <p class="subtitle__text">
                    <span
                      v-if="displaySubtitle"
                      class="subtitle__background">
                      {{ displaySubtitle }}
                    </span>
                  </p>
                </v-responsive>
              </v-flex>
              <v-layout
                wrap
                justify-center
                style="margin-top: 10px"
                row>
                <v-flex class="flex-grow-0">
                  <v-btn
                    depressed
                    class="small-button"
                    @click="replayVideo(5)"
                  >
                    <v-icon>
                      replay_5
                    </v-icon>
                  </v-btn>
                </v-flex>
                <v-flex class="flex-grow-0">
                  <v-btn
                    depressed
                    class="small-button"
                    @click="onPlayButtonClicked"
                  >
                    <v-icon>
                      {{ playIcon }}
                    </v-icon>
                  </v-btn>
                </v-flex>
                <v-flex class="flex-grow-0">
                  <v-btn
                    depressed
                    class="small-button"
                    @click="forwardVideo(5)"
                  >
                    <v-icon>
                      forward_5
                    </v-icon>
                  </v-btn>
                </v-flex>
              </v-layout>
              <v-layout
                v-if="selectedId !== -1"
                wrap
                align-center
                row>
                <v-flex
                  xs12
                  md6
                  class="flex-grow-0">
                  <v-btn @click="playFromSelectedStart">
                    <v-icon left>
                      play_arrow
                    </v-icon>
                    編集中の開始時間から再生
                  </v-btn>
                </v-flex>
                <v-flex
                  md6
                  xs12>
                  <v-switch
                    v-model="loop"
                    color="#1976d2"
                    label="編集位置をリピート"
                  />
                </v-flex>
                <v-flex
                  xs6
                  md3
                  class="flex-grow-0">
                  <v-btn @click="setCurrentTimeToStart">
                    現在の再生時間
                  </v-btn>
                </v-flex>
                <v-flex
                  xs6
                  md3
                  class="flex-grow-0">
                  <v-text-field
                    :value="selectedStart"
                    type="number"
                    label="開始時間（秒）"
                    @input="formatStartTime"/>
                </v-flex>
                <v-flex
                  xs6
                  md2
                  class="flex-grow-0">
                  <v-btn
                    @click="() => {
                      selectedStart = (selectedStart * 10 - 1) / 10;
                      formatStartTime(selectedStart);
                  }">
                    -0.1
                  </v-btn>
                </v-flex>
                <v-flex
                  xs6
                  md2
                  class="flex-grow-0">
                  <v-btn
                    @click="() => {
                      selectedStart = (selectedStart * 10 + 1) / 10;
                      formatStartTime(selectedStart);
                  }">
                    +0.1
                  </v-btn>
                </v-flex>
                <v-flex
                  xs6
                  md3
                  class="flex-grow-0">
                  <v-btn @click="setCurrentTimeToEnd">
                    現在の再生時間
                  </v-btn>
                </v-flex>
                <v-flex
                  xs6
                  md3
                  class="flex-grow-0">
                  <v-text-field
                    :value="selectedEnd"
                    type="number"
                    label="終了時間（秒）"
                    @input="formatEndTime"/>
                </v-flex>
                <v-flex
                  xs6
                  md2
                  class="flex-grow-0">
                  <v-btn
                    @click="() => {
                      selectedEnd = (selectedEnd * 10 - 1) / 10;
                      formatEndTime(selectedEnd);
                  }">
                    -0.1
                  </v-btn>
                </v-flex>
                <v-flex
                  xs6
                  md2
                  class="flex-grow-0">
                  <v-btn
                    @click="() => {
                      selectedEnd = (selectedEnd * 10 + 1) / 10;
                      formatEndTime(selectedEnd);
                  }">
                    +0.1
                  </v-btn>
                </v-flex>
                <v-flex
                  xs12
                  class="flex-grow-0">
                  <v-textarea
                    v-model="selectedSubtitle"
                    flat
                    label="字幕"
                    auto-grow
                    rows="2"/>
                </v-flex>
              </v-layout>
            </v-layout>
          </v-container>
        </v-flex>
        <v-flex
          xs5>
          <v-container
            class="padding-0 subtitle-container"
            grid-list-sm>
            <v-layout
              justify-space-between
              row>
              <v-btn
                @click="addSubtitleCard">
                <v-icon left>
                  add_comment
                </v-icon>
                字幕を追加
              </v-btn>
              <v-menu
                bottom
                left>
                <v-btn
                  slot="activator"
                  dark
                  icon
                >
                  <v-icon>more_vert</v-icon>
                </v-btn>
                <v-list>
                  <v-list-tile @click="deleteAllButtonClicked">
                    <v-list-tile-title>すべて削除する</v-list-tile-title>
                  </v-list-tile>
                </v-list>
              </v-menu>
            </v-layout>
            <v-radio-group v-model="selectedId">
              <v-layout
                column
                class="subtitle-container">
                <dynamic-scroller
                  ref="dynamicScroller"
                  :key="selectedSubtitleVer"
                  :items="subtitleList"
                  :min-item-height="86"
                  style="height:100%"
                >
                  <template slot-scope="{ item, index, active }">
                    <dynamic-scroller-item
                      :item="item"
                      :active="active"
                      :size-dependencies="[item.text, item.height]">
                      <v-flex
                        v-resize="onSubtitleCardResized(item)"
                        ref="subtitleCardContainer"
                        :key="item.id">
                        <subtitle-card
                          :ref="item.id"
                          :selected-id="selectedId"
                          :id="item.id"
                          :start="item.start"
                          :end="item.end"
                          :text="item.text"
                          :prop-has-error="item.hasError"
                          @subtitleCardSelectedEvent="onSubtitleCardSelected"
                          @subtitleCardCloseEvent="onSubtitleCardClosed"/>
                      </v-flex>
                    </dynamic-scroller-item>
                  </template>
                </dynamic-scroller>
              </v-layout>
            </v-radio-group>
          </v-container>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import SubtitleCard from "~/components/SubtitleCard.vue"
import download from "downloadjs"
import axios from "axios"
import parseSRT from 'parse-srt'
import VueVirtualScroller from 'vue-virtual-scroller'

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
const LOCAL_STORAGE_EDIT_CAPTION = "editCaption";

Vue.use(VueYoutube)
Vue.use(VueVirtualScroller)

export default {
  components: {
    SubtitleCard,
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
      notifycanEditAtYoutubeDialog: false,
      confirmDialog: false,
      confirmDialogText: "",
      confirmDialogAcceptText: "",
      confirmDialogAcceptFunction: null,
      confirmDialogAceeptButtonColor: "green darken-1",
      errorSnackbar: false,
      errorIndex: -1,
      autoSave: false
    }
  },
  async asyncData({ params, query }) {
    let notifycanEditAtYoutubeDialog = false;
    if (query.status === "editable") {
      notifycanEditAtYoutubeDialog = true;
    }

    return {
      videoId: params.videoid,
      notifycanEditAtYoutubeDialog: notifycanEditAtYoutubeDialog
    }
  },
  watch: {
    async selectedId(val) {
      if (this.preSelectedId !== -1) {
        try {
          this.$refs[this.preSelectedId].select(false);
        } catch (e) { }
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
      if (this.autoSave) {
        localStorage.setItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId, JSON.stringify(this.subtitleList));
      }
      console.log("selectedSub");
    },
    subtitleList(val) {
      if (this.autoSave && val && val.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId, JSON.stringify(val));
      }
      console.log("subtitleList");
    },
    autoSave(val) {
      if (val) {
        localStorage.setItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId, JSON.stringify(this.subtitleList));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId);
      }
    }
  },
  created() {
    this.$emit("searchTargetChangedEvent", "video");
    if (localStorage.getItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId)) {
      this.subtitleList = JSON.parse(localStorage.getItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId));
      this.autoSave = true;
    }
  },
  destroyed() {
    this.destroyed = true;
  },
  mounted() {
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
        this.$refs.dynamicScroller.scrollToItem(this.subtitleList.length - 1);
        this.selectedId = id;
      });
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
      console.log("playing");
      this.playIcon = "pause";
    },
    readyVideo() {
      console.log("ready");
    },
    videoError() {
      console.log("error");
    },
    videoPaused() {
      console.log("paused");
      this.playIcon = "play_arrow";
    },
    formatStartTime(val) {
      console.log("change start");
      const tempTime = Math.floor(Number(val) * 1000) / 1000;
      console.log(val);
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
      console.log("change end");
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
          this.$refs.dynamicScroller.scrollToItem(selectedItemIndex);
        }
      });

      for (let i = 0; i < this.subtitleList.length; i++) {
        const target = this.subtitleList[i];
        const oneBefore = this.subtitleList[i - 1];

        if (i > 1 && oneBefore.end > target.start) {
          target.hasError = true;
          try {
            this.$refs[target.id].error(true);
          } catch (e) { };
          oneBefore.hasError = true;
          try {
            this.$refs[oneBefore.id].error(true);
          } catch (e) { };

          if (!this.errorSnackbar) {
            this.errorIndex = i - 1;
            this.snackbarText = "時間が重なっています";
            this.errorSnackbar = true;
          }

          continue;
        }

        if (target.start === target.end) {
          target.hasError = true;
          try {
            this.$refs[target.id].error(true);
          } catch (e) { };

          if (!this.errorSnackbar) {
            this.errorIndex = i;
            this.snackbarText = "開始時間と終了時間が同じです";
            this.errorSnackbar = true;
          }

          continue;
        }

        target.hasError = false;
        try {
          this.$refs[target.id].error(false);
        } catch (e) { };
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
    async forwardVideo(diff) {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      this.$refs.youtube.player.seekTo(currentTime + diff, true);
    },
    async replayVideo(diff) {
      const currentTime = await this.$refs.youtube.player.getCurrentTime();
      this.$refs.youtube.player.seekTo(currentTime - diff, true);
    },
    downloadSubRip() {
      this.subtitleList.forEach((e, i) => {
        if (i === this.subtitleList.length - 1) {
          return;
        }

        if (e.end > this.subtitleList[i + 1].start) {
          console.log(e.end + "-" + this.subtitleList[i + 1].start);
          e.end = this.subtitleList[i + 1].start;
        }
      });
      const filteredSubtitleList = this.subtitleList.filter(e => e.text);
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

        this.snackbarText = "ダウンロード完了";
        this.snackbarColor = "success";
      } else {
        this.snackbarText = "字幕を入力してください";
        this.snackbarColor = "error";
      }

      this.snackbar = true;
      localStorage.removeItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId);
    },
    async uploadSubtitle() {
      this.progressDialog = true;

      this.sortAndCheckOrder();
      if (this.subtitleList.find(e => e.hasError)) {
        this.progressDialog = false;
        return;
      }

      const filteredSubtitleList = this.subtitleList.filter(e => !e.text);
      console.log(filteredSubtitleList);
      if (filteredSubtitleList.length === 0) {
        let output = [];
        this.subtitleList.forEach((subtitle, index) => {
          output.push([subtitle.start, subtitle.end - subtitle.start, subtitle.text]);
        });

        await axios.post("/api/edit/subtitle", {
          videoId: this.videoId,
          items: output
        }).then(res => {
          this.snackbarText = "アップロード完了";
          this.snackbarColor = "success";
          this.snackbar = true;
          localStorage.removeItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId);
        }).catch(error => {
          console.log(error.response.data);
          this.snackbarText = `アップロード失敗${error.response.data}`;
          this.snackbarColor = "error";
          this.snackbar = true;
        });
      } else {
        filteredSubtitleList.forEach(e => {
          e.hasError = true;
          try {
            this.$refs[e.id].error(true);
          } catch (e) { };
        });

        this.errorIndex = filteredSubtitleList[0].id;
        this.snackbarText = "字幕を入力してください";
        this.errorSnackbar = true;
      }

      this.progressDialog = false;
    },
    zeroPadding(count, target) {
      return ("0".repeat(count) + target).slice(count * -1);
    },
    showPickSubRipFileDialog() {
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
            this.selectedId = -1;
            this.selectedSubtitleVer++;
            this.sortAndCheckOrder();
          });
        } catch (e) {
          this.snackbarText = "読み込みに失敗しました";
          this.snackbarColor = "error";
          this.snackbar = true;
          console.log(e);
        }
      }.bind(this)
    },
    onSubtitleCardResized(item) {
      try {
        this.$nextTick(() => {
          item.height = this.$refs.subtitleCardContainer.clientHeight;
        });
      } catch (e) { }
    },
    uploadButtonClicked() {
      this.confirmDialogText = "字幕をどっとライブボタンにアップロードします";
      this.confirmDialogAcceptText = "アップロード";
      this.confirmDialogAcceptFunction = this.uploadSubtitle;
      this.confirmDialogAceeptButtonColor = "green darken-1";
      this.confirmDialog = true;
    },
    deleteAllButtonClicked() {
      this.confirmDialogText = "編集中の字幕をすべて削除します";
      this.confirmDialogAcceptText = "削除";
      this.confirmDialogAcceptFunction = this.deleteAllSubtitle;
      this.confirmDialogAceeptButtonColor = "red darken-1";
      this.confirmDialog = true;
    },
    deleteAllSubtitle() {
      this.subtitleList = [];
      this.selectedId = -1;
      this.preSelectedId = -1
      this.selectedStart = 0;
      this.selectedEnd = 0;
      this.selectedSubtitle = "";
      localStorage.removeItem(LOCAL_STORAGE_EDIT_CAPTION + this.videoId);
    }
  }
}
</script>

<style>
.video-id__field .v-text-field.v-text-field--solo .v-input__control {
  min-height: 35px;
}
.video-id__field .v-input__control .v-input__slot {
  margin-bottom: 0;
}
.subtitle-container {
  height: calc(100vh - 170px - 38px);
  margin-left: 10px;
}
.subtitle-container .v-input--selection-controls {
  margin-top: 2px;
}
.subtitle-container .v-btn {
  margin-top: 0;
}
.flex-grow-0 {
  flex-grow: 0;
}
.padding-0 {
  padding: 0;
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
</style>

