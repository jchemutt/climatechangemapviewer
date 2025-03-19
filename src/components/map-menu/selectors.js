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
  (state.datasets?.loading || state.countryData?.loading) || false;
const getAnalysisLoading = (state) => state.analysis?.loading || false;
const getDatasets = (state) => state.datasets?.data || [];
const getLocation = (state) => state.location?.payload || {};
const getApiSections = (state) => state.config?.sections || [];
export const selectmapLocationGeostore = (state) =>
  state.geostore?.mapLocationGeostore || {};
const selectLoggedIn = (state) => state.auth?.data?.loggedIn || false;
const selectEnableMyAccount = (state) => state.config?.enableMyAccount || false;

export const getMenuSection = createSelector(
  [getMenuSettings],
  (settings) => settings.menuSection || ""
);

export const getSubCategoryGroupsSelected = createSelector(
  [getMenuSettings],
  (settings) => settings.subCategoryGroupsSelected || {}
);

export const getDatasetCategory = createSelector(
  [getMenuSettings],
  (settings) => settings.datasetCategory || ""
);

export const getSearch = createSelector(
  [getMenuSettings],
  (settings) => settings.search || ""
);

export const getSearchType = createSelector(
  [getMenuSettings],
  (settings) => settings.searchType || ""
);

export const getExploreType = createSelector(
  [getMenuSettings],
  (settings) => settings.exploreType || ""
);

export const getDatasetSections = createSelector(
  [getApiSections, getDatasets, selectLoggedIn],
  (apiSections, allDatasets, loggedIn) => {
    if (!apiSections.length) return [];

    const sections = apiSections.map((section) => ({
      ...section,
      icon: icons[section.icon] ? icons[section.icon] : { id: section.icon },
      Component: Datasets,
    }));

    if (isEmpty(allDatasets)) return sections;

    let datasets = loggedIn ? allDatasets : allDatasets.filter((d) => d.public);

    return sections.map((s) => {
      const { id, subCategories } = s;
      const sectionDatasets = datasets.filter((d) => d.category === id);

      let subCategoriesWithDatasets = [];
      if (subCategories) {
        subCategoriesWithDatasets = subCategories.map((subCat) => ({
          ...subCat,
          datasets: sectionDatasets.filter((d) => d.sub_category === subCat.id),
        }));
      }

      return {
        ...s,
        datasets: sectionDatasets,
        subCategories: subCategoriesWithDatasets,
      };
    });
  }
);

export const getDatasetSectionsWithData = createSelector(
  [
    getDatasetSections,
    getActiveDatasetsFromState,
    getDatasetCategory,
    getMenuSection,
  ],
  (sections, activeDatasets, datasetCategory, menuSection) => {
    if (!sections.length) return [];
    const datasetIds = activeDatasets.map((d) => d.dataset);

    return sections.map((s) => ({
      ...s,
      active: datasetCategory === s.category && menuSection === s.slug,
      layerCount: s.datasets?.filter((d) => datasetIds.includes(d.id)).length || 0,
      datasets: s.datasets?.map((d) => ({
        ...d,
        active: datasetIds.includes(d.id),
      })) || [],
      subCategories: s.subCategories?.map((subCat) => ({
        ...subCat,
        datasets: subCat.datasets?.map((d) => ({
          ...d,
          active: datasetIds.includes(d.id),
        })) || [],
      })) || [],
    }));
  }
);

export const getAllSections = createSelector(
  [getDatasetSectionsWithData],
  (datasetSections) => {
    if (!datasetSections.length) return [];
    return [...datasetSections, ...searchSections, ...mobileSections];
  }
);

export const getActiveSection = createSelector(
  [getAllSections, getMenuSection, getDatasetCategory],
  (sections, menuSection, datasetCategory) => {
    if (!sections.length || !menuSection) return null;
    return sections.find((s) =>
      s.category
        ? s.category === datasetCategory && s.slug === menuSection
        : s.slug === menuSection
    );
  }
);

export const getActiveSectionWithData = createSelector(
  [getActiveSection],
  (section) => {
    if (!section) return null;
    const subCatsWithData = section.subCategories?.filter((s) => !isEmpty(s.datasets)) || [];
    return {
      ...section,
      ...(subCatsWithData.length && { subCategories: subCatsWithData }),
    };
  }
);

export const getSearchSections = createSelector(
  [getMenuSection, selectEnableMyAccount],
  (menuSection, myAccountEnabled) => {
    if (!searchSections) return [];
    let sections = searchSections.map((s) => ({
      ...s,
      active: menuSection === s.slug,
    }));
    if (!myAccountEnabled) {
      sections = sections.filter((s) => s.slug !== "my-account");
    }
    return sections;
  }
);

const getLegendLayerGroups = createSelector([getLayerGroups], (groups) => {
  if (!groups) return [];
  return groups.filter((g) => !g.isBoundary && !g.isRecentImagery && !g.isLiveImagery);
});

export const getMobileSections = createSelector(
  [
    getMenuSection,
    getLegendLayerGroups,
    getLocation,
    getEmbed,
    selectEnableMyAccount,
  ],
  (menuSection, activeDatasets, location, embed, myAccountEnabled) => {
    let sections = mobileSections
      .filter((s) => !embed || s.embed)
      .map((s) => ({
        ...s,
        ...(s.slug === "datasets" && { layerCount: activeDatasets.length }),
        ...(s.slug === "analysis" && { highlight: !!location.type && !!location.adm0 }),
        active: menuSection === s.slug,
      }));
    if (!myAccountEnabled) {
      sections = sections.filter((s) => s.slug !== "my-account");
    }
    return sections;
  }
);

export const getDatasetCategories = createSelector(
  [getDatasetSectionsWithData],
  (datasets) =>
    datasets?.map((s) => ({
      ...s,
      label: startCase(s.category),
    })) || []
);

export const getMenuProps = createStructuredSelector({
  datasetSections: getDatasetSectionsWithData,
  searchSections: getSearchSections,
  mobileSections: getMobileSections,
  activeSection: getActiveSectionWithData,
  menuSection: getMenuSection,
  activeDatasets: getActiveDatasetsFromState,
  datasetCategory: getDatasetCategory,
  datasetCategories: getDatasetCategories,
  search: getSearch,
  searchType: getSearchType,
  location: getLocation,
  loading: getLoading,
  analysisLoading: getAnalysisLoading,
  zoom: getMapZoom,
  comparing: getComparing,
  activeCompareSide: getActiveCompareSide,
  geostore: selectGeostore,
  mapLocationGeostore: selectmapLocationGeostore,
  allDatasets: getDatasets,
  subCategoryGroupsSelected: getSubCategoryGroupsSelected,
  loggedIn: selectLoggedIn,
});
