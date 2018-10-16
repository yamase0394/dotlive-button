<template>
  <div


  >
    <div
      class="container">
      <div class="scrollable"/>
    </div>
  </div>

</template>

<style>
.container {
  max-height: 100vh;
  overflow-y: scroll;
  overscroll-behavior: contain;
}
.scrollable {
  height: 2000px;
  overscroll-behavior: contain;
}
</style>

