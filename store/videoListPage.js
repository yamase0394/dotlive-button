export const state = () => ({
  isAsrFilter: false,
  captionFilter: ""
});

export const mutations = {
  captionFilter: (state, captionFilter) => {
    state.captionFilter = captionFilter;
  }
};

export const getters = {
  isAsrFilter: state => {
    return state.captionFilter === "asr";
  },
  isPartialFilter: state => {
    return state.captionFilter === "partial";
  }
};
