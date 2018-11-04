<template>
  <v-card
    :class="cardStyle"
    ripple
    @click.native="onCardClicked()"
  >
    <v-container
      class="subtitle-card-container">
      <v-layout row>
        <v-layout
          class="flex-grow-0 time__layout"
          column>
          <v-flex class="padding-4">
            <v-radio
              :value="id"
              color="#1976d2"
              style="margin:0;"/>
          </v-flex>
          <v-flex class="padding-4">
            <p class="time__text">{{ startTime }}</p>
          </v-flex>
          <v-flex class="padding-4">
            <p class="time__text">{{ endTime }}</p>
          </v-flex>
        </v-layout>
        <v-flex >
          <v-textarea
            v-model="subtitle"
            flat
            solo
            readonly
            hide-details
            auto-grow
            rows="2"/>
        </v-flex>
        <v-flex class="flex-grow-0 padding-0">
          <v-btn
            class="small__btn"
            small
            icon
            @click="onCloseClicked">
            <v-icon small> close </v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
export default {
  props: {
    id: {
      type: Number,
      required: true
    },
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      default: ""
    },
    selectedId: {
      type: Number,
      default: -1
    },
    propHasError: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      subtitle: "",
      startTime: 0,
      endTime: 1,
      playIcon: "loop",
      closed: false,
      isSelected: false,
      hasError: false,
      cardStyle: "not-selected-card",
    }
  },
  created() {
    this.startTime = this.start;
    this.endTime = this.end;
    this.subtitle = this.text;
    this.isSelected = this.id === this.selectedId;
    this.hasError = this.propHasError;

    this.select(this.isSelected);
    this.error(this.hasError);
  },
  methods: {
    getData() {
      return [this.id, this.startTime, this.endTime, this.subtitle];
    },
    onCloseClicked() {
      this.$emit("subtitleCardCloseEvent", this.id);
      this.closed = true;
    },
    setStart(start) {
      this.startTime = start;
    },
    setEnd(end) {
      this.endTime = end;
    },
    setSubtitle(subtitle) {
      this.subtitle = subtitle;
    },
    onCardClicked() {
      if (!this.closed) {
        this.$emit("subtitleCardSelectedEvent", this.id);
      }
    },
    select(isSelected) {
      this.isSelected = isSelected;
      if (this.hasError) {
        this.cardStyle = "error-card";
      } else {
        if (isSelected) {
          this.cardStyle = "selected-card";
        } else {
          this.cardStyle = "not-selected-card";
        }
      }
    },
    error(hasError) {
      this.hasError = hasError;
      if (hasError) {
        this.cardStyle = "error-card";
      } else {
        if (this.isSelected) {
          this.cardStyle = "selected-card";
        } else {
          this.cardStyle = "not-selected-card";
        }
      }
    }
  },
}
</script>

<style>
.padding-0 {
  padding: 0 !important;
}
.padding-4 {
  padding: 1px 0 1px 5px !important;
}
.flex-grow-0 {
  flex-grow: 0;
}
.subtitle-card-container {
  padding: 5px 5px 5px 10px;
}
.subtitle-card:hover {
  cursor: pointer;
}
.time__text {
  margin: 0;
  font-size: 14px;
}
.time__layout {
  margin-right: 10px !important;
  width: 58px;
}
.container.grid-list-md *:not(:only-child) .layout:first-child .time__layout {
  margin-top: 5px;
}
.small__btn {
  margin: 0;
}
.not-selected-card {
  background-color: #212121 !important;
}
.selected-card {
  background-color: #1976d2 !important;
}
.error-card {
  background-color: #d32f2f !important;
}
</style>