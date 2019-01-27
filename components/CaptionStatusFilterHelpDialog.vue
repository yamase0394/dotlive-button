<template>
  <v-dialog
    v-model="dialog"
    max-width="40vw"
    @keydown.esc="dialog = false"
  >
    <v-card>
      <v-card-text>
        <v-layout
          column
          justify-center
        >
          <v-flex xs12>
            <div class="headline__section">
              <p class="title">
                字幕フィルターについて
              </p>
              <p />
              <v-divider />
            </div>
            <ul>
              <li class="subheading">
                あり
              </li>
              <p class="body-2">
                YouTubeまたは、当サイトのみに字幕のある動画です。<br>
                単純にボタンを使いたい場合は、このフィルターを使用してください。
              </p>
              <li class="subheading">
                自動生成
              </li>
              <div class="normal__section">
                <p class="body-2">
                  YouTubeで自動生成された字幕のある動画です。<br>
                </p>
              </div>
              <li class="subheading">
                編集可
              </li>
              <div class="normal__section">
                <p class="body-2">
                  日本語字幕が無い動画のうち、YouTubeでの編集が許可されているものです。<br>
                  当サイトの字幕作成機能で字幕を作成することができます。
                </p>
              </div>
              <li class="subheading">
                編集不可
              </li>
              <div class="normal__section">
                <p class="body-2">
                  日本語字幕が無い動画のうち、YouTubeでの編集が許可されていないものです。<br>
                  当サイトの字幕作成機能で字幕を作成することができます。
                </p>
              </div>
            </ul>
          </v-flex>
        </v-layout>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          flat
          @click="dialog = false"
        >
          閉じる
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
    }
  },
  methods: {
    open() {
      this.dialog = true;
    },
    close() {
      this.dialog = false;
    }
  }
}
</script>

<style>
.headline__section {
  padding-bottom: 10px;
}
.normal__section {
  padding-bottom: 0;
}
</style>

