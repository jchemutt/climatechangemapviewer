import { createSelector, createStructuredSelector } from "reselect";
import isEmpty from "lodash/isEmpty";
import startCase from "lodash/startCase";

import {
  getActiveDatasetsFromState,
  getLayerGroups,
  getMapZoom,
  getActiveCompareSide,
  getComparing,
  selectGeostore,
} from "@/components/map/selectors";

import { getEmbed } from "@/layouts/map/selectors";

import { searchSections, mobileSections } from "./sections";
import Datasets from "./components/sections/datasets";
import icons from "./icons";

const getMenuSettings = (state) => state.mapMenu?.settings || {};
const getLoading = (state) =>
  (state.datasets && state.datasets.loading) ||
  (state.countryData && state.countryData.loading);
const getAnalysisLoading = (state) => state.analysis && state.analysis.loading;
const getDatasets = (state) => state.datasets && state.datasets.data;
const getLocation = (state) => state.location && state.location.payload;
const getApiSections = (state) => (state.config && state.config.sections) || [];
export const selectmapLocationGeostore = (state) =>
  state.geostore && state.geostore.mapLocationGeostore;
const selectLoggedIn = (state) => state.auth?.data?.loggedIn;
const selectEnableMyAccount = (state) => state.config?.enableMyAccount;

export const getMenuSection = createSelector(
  [getMenuSettings],
  (settings) => settings.menuSection
);

export const getDatasetCategory = createSelector(
  [getMenuSettings],
  (settings) => settings.datasetCategory
);

// ✅ Ensure only datasets and analysis are available
export const getDatasetSections = createSelector(
  [getApiSections, getDatasets, selectLoggedIn],
  (apiSections, allDatasets, loggedIn) => {
    const sections = apiSections
      .filter((s) => ["datasets", "analysis"].includes(s.slug)) // ✅ Keep only allowed sections
      .map((section) => ({
        ...section,
        icon: icons[section.icon] ? icons[section.icon] : { id: section.icon },
        Component: Datasets,
      }));

    if (isEmpty(allDatasets)) return sections;

    let datasets = allDatasets;

    // show only public datasets if not logged in
    if (!loggedIn) {
      datasets = allDatasets.filter((d) => d.public);
    }

    return sections.map((s) => {
      const sectionDatasets = datasets.filter((d) => d.category === s.id);

      return {
        ...s,
        datasets: sectionDatasets,
      };
    });
  }
);

// ✅ Ensure active section is always "datasets" or "analysis"
export const getActiveSection = createSelector(
  [getDatasetSections, getMenuSection, getDatasetCategory],
  (sections, menuSection, datasetCategory) => {
    if (!sections || !menuSection) return null;

    return sections.find((s) =>
      s.category
        ? s.category === datasetCategory && s.slug === menuSection
        : s.slug === menuSection
    );
  }
);

export const getMenuProps = createStructuredSelector({
  datasetSections: getDatasetSections,
  activeSection: getActiveSection,
  menuSection: getMenuSection,
  activeDatasets: getActiveDatasetsFromState,
  datasetCategory: getDatasetCategory,
  loading: getLoading,
  analysisLoading: getAnalysisLoading,
  zoom: getMapZoom,
  comparing: getComparing,
  activeCompareSide: getActiveCompareSide,
  geostore: selectGeostore,
  mapLocationGeostore: selectmapLocationGeostore,
});
