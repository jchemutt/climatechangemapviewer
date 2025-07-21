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
  climateFilters: {
      variable: [],
      timePeriod: [],
      scenario: [],
      model: [],
      timeStep: [],
      calculation: [],
      selectedMonths: [],
  },
};


const setLocationsData = (state, { payload }) => ({
  ...state,
  locations: [...payload], 
});


const setMenuSettings = (state, { payload }) => ({
  ...state,
  settings: {
    ...state.settings,
    ...payload,
  },
});


const setMenuLoading = (state, { payload }) => ({
  ...state,
  loading: payload,
});

const setClimateFilters = (state, { payload }) => ({
  ...state,
  climateFilters: {
    ...state.climateFilters,
    ...payload,
  },
});


export default {
  [actions.setLocationsData]: setLocationsData,
  [actions.setMenuSettings]: setMenuSettings,
  [actions.setMenuLoading]: setMenuLoading,
  [actions.setClimateFilters]: setClimateFilters,
};
