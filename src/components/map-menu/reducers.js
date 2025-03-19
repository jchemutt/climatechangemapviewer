import * as actions from "./actions";

export const initialState = {
  locations: [],
  loading: false,
  settings: {
    menuSection: "",
    datasetCategory: "",
    exploreType: "topics",
    searchType: "location",
    myHWType: "myAOI",
    search: "",
    selectedCountries: [],
    subCategoryGroupsSelected: {},
  },
};

// ✅ Ensure immutable state updates
const setLocationsData = (state, { payload }) => ({
  ...state,
  locations: [...payload], // ✅ Spread new data to avoid mutation
});

// ✅ Ensure settings are updated safely
const setMenuSettings = (state, { payload }) => ({
  ...state,
  settings: {
    ...state.settings,
    ...payload,
  },
});

// ✅ Handle menu loading
const setMenuLoading = (state, { payload }) => ({
  ...state,
  loading: payload,
});

// ✅ Combine reducers
export default {
  [actions.setLocationsData]: setLocationsData,
  [actions.setMenuSettings]: setMenuSettings,
  [actions.setMenuLoading]: setMenuLoading,
};
