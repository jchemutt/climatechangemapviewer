import { createAction, createThunkAction } from "@/redux/actions";
import { fetchGeocodeLocations } from "@/services/geocoding";

import { setMapSettings, setMapInteractions } from "@/components/map/actions";
import { setAnalysisSettings } from "@/components/analysis/actions";

export const setLocationsData = createAction("setLocationsData");
export const setMenuLoading = createAction("setMenuLoading");

// ✅ Allow switching between dataset and analysis menus
export const setMenuSettings = createAction("setMenuSettings", (menuSettings) => {
  const allowedSections = ["datasets", "analysis"];
  return {
    ...menuSettings,
    menuSection: allowedSections.includes(menuSettings.menuSection)
      ? menuSettings.menuSection
      : "datasets", // ✅ Default to datasets if menuSection is invalid
  };
});

export const getLocationFromSearch = createThunkAction(
  "getLocationFromSearch",
  ({ search, token, lang }) => (dispatch) => {
    dispatch(setMenuLoading(true));

    if (search) {
      fetchGeocodeLocations(search, lang, token)
        .then((locations) => {
          if (locations?.length) {
            dispatch(setLocationsData(locations));
          } else {
            dispatch(setLocationsData([]));
          }
          dispatch(setMenuLoading(false));
        })
        .catch(() => {
          dispatch(setMenuLoading(false));
        });
    }
  }
);

export const handleClickLocation = createThunkAction(
  "handleClickLocation",
  ({ center, bbox: featureBbox, ...feature }) => (dispatch) => {
    if (featureBbox) {
      dispatch(setMapSettings({ canBound: true, bbox: featureBbox }));
    } else {
      dispatch(
        setMapSettings({ center: { lat: center[1], lng: center[0] }, zoom: 12 })
      );
    }
    dispatch(setMapInteractions({ features: [feature], lngLat: center }));

    // ✅ Ensure menu stays open in datasets mode
    dispatch(setMenuSettings({ menuSection: "datasets" }));
  }
);

export const handleViewOnMap = createThunkAction(
  "handleViewOnMap",
  ({ analysis, mapMenu, map }) => (dispatch) => {
    if (map) {
      dispatch(setMapSettings({ ...map, canBound: true }));
    }

    // ✅ Allow analysis but prevent closing the menu
    dispatch(
      setMenuSettings({
        ...mapMenu,
        menuSection: mapMenu.menuSection === "analysis" ? "analysis" : "datasets",
      })
    );

    if (analysis) {
      dispatch(setAnalysisSettings(analysis));
    }
  }
);

export const showAnalysis = createThunkAction(
  "showAnalysis",
  () => (dispatch) => {
    // ✅ Allow switching to analysis menu
    dispatch(
      setMenuSettings({
        menuSection: "analysis",
      })
    );
  }
);
