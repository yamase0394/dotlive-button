export const state = () => ({
  target: "button",
  includesAsr: false,
  keyword: "",
  channelIdFilter: "",
  captionStatusFilter: ""
});

export const mutations = {
  target: (state, target) => {
    state.target = target;
  },
  includesAsr: (state, includesAsr) => {
    state.includesAsr = includesAsr;
  },
  keyword: (state, keyword) => {
    state.keyword = keyword;
  },
  channelIdFilter: (state, channelId) => {
    state.channelIdFilter = channelId;
  },
  captionStatusFilter: (state, captionStatus) => {
    state.captionStatusFilter = captionStatus;
  }
};

export const getters = {
  path: state => {
    return (
      "/search/" +
      (state.target === "button" && state.includesAsr ? "asr" : state.target) +
      "?keyword=" +
      state.keyword +
      (state.channelIdFilter ? `&channel=${state.channelIdFilter}` : "") +
      (state.target === "video" && state.captionStatusFilter
        ? `&caption=${state.captionStatusFilter}`
        : "")
    );
  },
  buttonPath: state => {
    return (
      "/search/" +
      (state.includesAsr ? "asr" : "button") +
      "?keyword=" +
      state.keyword +
      (state.channelIdFilter ? `&channel=${state.channelIdFilter}` : "")
    );
  },
  videoPath: state => {
    return (
      "/search/video" +
      "?keyword=" +
      state.keyword +
      (state.channelIdFilter ? `&channel=${state.channelIdFilter}` : "") +
      (state.captionStatusFilter ? `&caption=${state.captionStatusFilter}` : "")
    );
  }
};
