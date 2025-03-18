import * as actions from "./actions";

export const initialState = {
  locations: [],
  loading: false,
  settings: {
    menuSection: "datasets", // ✅ Default to datasets
    datasetCategory: "fixed-category-id", // ✅ Pre-set category
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
      menuSection: allowedSections.includes(payload.menuSection)
        ? payload.menuSection
        : "datasets", // ✅ Force back to datasets if invalid
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
