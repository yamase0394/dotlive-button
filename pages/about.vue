<template>
  <v-container>
    <v-layout
      column
      justify-center
    >
      <v-flex xs12>
        <div class="headline__section">
          <p class="display-1"> このサイトについて </p>
          <p class="body-2">
            どっとライブメンバーの音声を再生するWebサイトです。
          </p>
          <v-divider/>
        </div>
        <p class="headline"> 使い方 </p>
        <div class="normal__section">
          <p class="body-2">
            使い方のページを作っておいてなんですが、これといって説明が必要なことは無いと思います。
            ただ、一つおすすめがあるので説明します。
          </p>
          <p class="body-2">
            ボタンページにあるこれ
            <v-tooltip
              open-delay="500"
              bottom>
              <v-btn
                slot="activator"
                class="demo__btn"
                depressed
              >
                <v-icon
                  small>
                  open_in_new
                </v-icon>
              </v-btn>
              <span>動画ページを開く</span>
            </v-tooltip>
            を押したときに表示される動画ページのリンクをコピーすると、
            台詞を共有できるので是非使ってみてください。
          </p>
          <p>
            <nuxt-link
              class="blue--text"
              target="_blank"
              to="video/q2UWxCEumnM?start=10.94&end=13.1">こんな感じ</nuxt-link>
          </p>
        </div>
        <p><v-divider/></p>
        <p class="headline"> その他 </p>
        <div class="normal__section">
          <p class="body-2">
            <a
              class="blue--text"
              target="_blank"
              href="https://sirobutton.herokuapp.com/sirobutton/">シロボタン</a>
            や、
            <a
              class="blue--text"
              target="_blank"
              href="https://natobutton.web.fc2.com/nato.html">なとボタン</a>
            、
            <a
              class="blue--text"
              target="_blank"
              href="https://efutei.github.io/ReversibleTama/">たまボタン</a>
            などはありますが、箱推し勢としては、どっとライブ全体の物が無いのが癪だったので作りました。
            最初はアイドル部で作ろうと考えていたのですが、それだとばあちゃるさんがいないのでどっとライブ全体にしました。
          </p>
        </div>
        <div class="normal__section">
          <p class="body-2">
            設計はシロボタンの作者様の考えに賛同し、YouTubeで直接再生する形にしました。
            しかし、YouTubeの字幕から再生時間を取得している都合上、
            一部のメンバーのボタンしかない状況です（どっとライブボタンとは）。
            なので、こつこつ字幕を作成しようと思っています。
            完成は遠い...
          </p>
        </div>
      </v-flex>
      <v-flex xs12>
        <p class="body-2">
          何か意見などがあれば
          <a
            class="blue--text"
            target="_blank"
            href="https://twitter.com/sla0394">こちら</a>
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
