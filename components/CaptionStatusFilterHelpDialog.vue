<template>
  <v-dialog
    v-model="dialog"
    max-width="60vw"
    @keydown.esc="dialog = false">
    <v-card>
      <v-card-text>
        <v-layout
          column
          justify-center
        >
          <v-flex xs12>
            <div class="headline__section">
              <p class="title"> 字幕フィルターについて </p>
              <p/>
              <v-divider/>
            </div>
            <ul>
              <li class="subheading">あり</li>
              <p class="body-2">
                YouTubeに日本語字幕のあるまたは、当サイトのみに字幕のある動画です。<br>
                単純にボタンを使いたい場合は、このフィルターを使用してください。
              </p>
              <li class="subheading">どっとライブボタン限定</li>
              <div class="normal__section">
                <p class="body-2">
                  YouTubeに字幕がアップロードできないため、当サイトのみに字幕のある動画です。<br>
                </p>
              </div>
              <li class="subheading">アップロード可能</li>
              <div class="normal__section">
                <p class="body-2">
                  どっとライブボタン限定の字幕で、YouTubeにアップロード可能な動画です。<br>
                  字幕作成者はYouTubeへアップロードをお願いします。
                </p>
              </div>
              <li class="subheading">編集可</li>
              <div class="normal__section">
                <p class="body-2">
                  日本語字幕が無い動画のうち、YouTubeでの編集が許可されているものです。<br>
                  当サイトの字幕作成機能で字幕を作成することができますが、
                  YouTube公式の機能でも作成可能なため、好きな方を使用すると良いでしょう。
                </p>
              </div>
              <li class="subheading">編集不可</li>
              <div class="normal__section">
                <p class="body-2">
                  日本語字幕が無い動画のうち、YouTubeでの編集が許可されていないものです。<br>
                  当サイトの字幕作成機能で字幕を作成することができます。
                </p>
              </div>
              <li class="subheading">審査待ち</li>
              <div class="normal__section">
                <p class="body-2">
                  YouTubeで字幕審査待ちの動画です。
                </p>
              </div>
              <li class="subheading">確認中</li>
              <div class="normal__section">
                <p class="body-2">
                  当サイトの字幕作成機能でアップロードされた字幕のうち、当サイトに未反映のものです。
                </p>
              </div>
            </ul>
          </v-flex>
        </v-layout>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
          flat
          @click="dialog = false">
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

