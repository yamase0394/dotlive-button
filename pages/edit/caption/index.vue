<template>
  <v-container>
    <v-layout
      column
      justify-center
    >
      <v-flex xs12>
        <div class="headline__section">
          <p class="display-1"> 字幕作成 </p>
          <v-divider/>
        </div>
        <p class="headline"> はじめに </p>
        <div class="normal__section">
          <p class="body-2">
            どっとライブボタンは、YouTubeの字幕からボタンを生成しています。そのため、ボタンの追加は、YouTubeの動画に直接字幕を追加すれば良いと考えていました。
            しかし、投稿者が第三者に対して字幕作成を許可していないため、作成できない動画が多々ありました。そこで、字幕の作成と、一時的な管理を行う機能を作りました。
          </p>
        </div>
        <p><v-divider/></p>
        <div class="normal__section">
          <p class="headline"> 使い方 </p>
          <p class="body-2">
            動画一覧もしくは、動画検索ページの字幕フィルターで編集可（YouTube公式の字幕作成機能でも編集できる）または、編集不可（YouTubeでは字幕の作成が許可されていない）を選択します。
            表示されたものをクリックすると字幕作成ページに移動します。編集位置をリピートなどで、字幕のタイミングを確認しつつ、作成してください。
          </p>
          <p class="body-2">
            完成したら、<strong>SUBRIPファイルを保存</strong>をクリックし、字幕_[動画ID].srtファイルをダウンロードします。
            このファイルは、YouTubeの字幕ページにアップロードすることができます。編集不可の場合は、このファイルを保管しておき、編集可能になった際にYouTubeにアップロードしてください。
          </p>
          <p class="body-2">
            編集不可の動画の字幕を作成した場合、よろしければ、<strong>字幕をアップロード</strong>をクリックし、アップロードをお願いします。
            そうすると、当サイトに作成した字幕が反映されます。
          </p>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  created() {
    this.$emit("searchTargetChangedEvent", "video");
  },
}
</script>

<style>
.headline__section {
  padding-bottom: 20px;
}
.normal__section {
  padding-bottom: 10px;
}
.demo__btn {
  min-width: 0;
  max-width: 20px;
  max-height: 20px;
  padding: 0;
}
</style>
