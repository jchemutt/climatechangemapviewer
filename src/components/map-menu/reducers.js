import * as actions from "./actions";

export const initialState = {
  locations: [],
  loading: false,
  settings: {
    menuSection: "datasets", // ✅ Default to datasets
    datasetCategory: "Climate Change", // ✅ Fixed category for embedded mode
    exploreType: "topics",
    searchType: "location",
    myHWType: "myAOI",
    search: "",
    selectedCountries: [],
    subCategoryGroupsSelected: {},
  },
};

// ✅ Ensure menu only switches between datasets and analysis
const setMenuSettings = (state, { payload }) => {
  const allowedSections = ["datasets", "analysis"];

  return {
    ...state,
    settings: {
      ...state.settings,
      ...payload,
      datasetCategory: "Climate Change", // ✅ Keep category fixed
      menuSection: allowedSections.includes(payload.menuSection)
        ? payload.menuSection
        : "datasets", // ✅ Prevent switching to invalid sections
    },
  };
};

const setLocationsData = (state, { payload }) => ({
  ...state,
  locations: payload,
});

const setMenuLoading = (state, { payload }) => ({
  ...state,
  loading: payload,
});

export default {
  [actions.setLocationsData]: setLocationsData,
  [actions.setMenuSettings]: setMenuSettings,
  [actions.setMenuLoading]: setMenuLoading,
};
