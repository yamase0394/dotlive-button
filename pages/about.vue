<template>
  <v-container>
    <v-layout
      column
      justify-center
    >
      <v-flex xs12>
        <div class="headline__section">
          <p class="display-1"> このサイトについて </p>
          <p class="subheading">
            どっとライブメンバーの音声を再生するWebサイトです。
          </p>
          <v-divider />
        </div>
        <div class="normal__section">
          <p class="body-1">
            <a
              class="blue--text"
              target="_blank"
              href="https://sirobutton.herokuapp.com/sirobutton/"
            >シロボタン</a>
            や、
            <a
              class="blue--text"
              target="_blank"
              href="https://natobutton.web.fc2.com/nato.html"
            >なとボタン</a>
            、
            <a
              class="blue--text"
              target="_blank"
              href="https://efutei.github.io/ReversibleTama/"
            >たまボタン</a>
            などはありますが、どっとライブ全体の物が無かったので作りました。<br>
            最初はアイドル部で作ろうと考えていたのですが、それだとばあちゃるさんがいないのでどっとライブ全体にしました。
          </p>
        </div>
        <div class="normal__section">
          <p class="body-1">
            設計はシロボタンの作者様の考えに賛同し、YouTubeで直接再生する形にしました。<br>
            しかし、YouTubeの字幕から再生時間を取得している都合上、
            一部のメンバーのボタンしかない状況です（どっとライブボタンとは）。<br>
            なので、こつこつ字幕を作成しようと思っています。
            完成は遠い...
          </p>
        </div>
      </v-flex>
      <v-flex xs12>
        <p class="body-1">
          何か意見などがあれば
          <a
            class="blue--text"
            target="_blank"
            href="https://twitter.com/sla0394"
          >Twitter</a>
          にお願いします。
        </p>
      </v-flex>
    </v-layout>
  </v-container>
</template>

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
