import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { trackEvent } from "@/utils/analytics";

import MenuPanel from "./components/menu-panel";
import MenuDesktop from "./components/menu-desktop";
import { connect } from "react-redux";


import "./styles.scss";

class MapMenu extends PureComponent {

  componentDidUpdate(prevProps) {
    const { comparing, activeDatasets, activeCompareSide, setMapSettings, } =
      this.props;
    const { comparing: prevComparing } = prevProps;



    // Ensure all existing layers stay on the default map side
    if (prevComparing !== comparing) {
      // Create a new copy of datasets
      const newActiveDatasets = activeDatasets.map((d) => ({
        ...d,
        mapSide: activeCompareSide,
      }));

      setMapSettings({
        datasets: [...newActiveDatasets],
      });
    }
  }

  

  onToggleLayer = (data, enable) => {
    const { activeDatasets, activeCompareSide, setMapSettings,climateFilters } = this.props;
    const { dataset, layer } = data;
    const isMonthlyToSeasonal = climateFilters?.timeStep?.includes("monthly_to_seasonal");
    const selectedMonths = climateFilters?.selectedMonths || [];

     if (
    enable && // Only when enabling the layer
    isMonthlyToSeasonal &&
    selectedMonths.length < 2
   ) {
    alert("Please select at least two months for dynamic seasonal analysis.");
    return;
   }

   

    // Ensure a new array is created before modification
    let newActiveDatasets = [...activeDatasets];

    if (!enable) {
      newActiveDatasets = newActiveDatasets.filter((l) => l.dataset !== dataset); // ✅ Use filter to avoid mutation
    } else {
      newActiveDatasets = [
        {
          dataset,
          opacity: 1,
          visibility: true,
          layers: [layer],
          ...(activeCompareSide && { mapSide: activeCompareSide }),
        },
        ...newActiveDatasets,
      ];
    }

    setMapSettings({
      datasets: [...newActiveDatasets],
      ...(enable && { canBound: true }),
    });

    trackEvent({
      category: "Map data",
      action: enable ? "User turns on a layer" : "User turns off a layer",
      label: layer,
    });
  };

  render() {
    const {
      className,
      datasetSections,
      setMenuSettings,
      loading,
      isDesktop,
      setSubCategorySettings,
      subCategoryGroupsSelected,
      mapViewerBaseUrl,
      ...props
    } = this.props;

    return (
      <div className={cx("c-map-menu", className)}>
        <div className="menu-tiles">
          {isDesktop && (
            <MenuDesktop
              className="menu-desktop"
              datasetSections={datasetSections}
              setMenuSettings={setMenuSettings}
            />
          )}
        </div>

        {/* Ensure dataset menu is always open */}
        <MenuPanel
          className={cx("menu-panel", "datasets")}
          active={true} 
          isDesktop={isDesktop}
          loading={loading}
          onClose={() => { }}
        >
          {datasetSections &&
          datasetSections.map(({ Component, ...sectionProps }) => (
            <Component
              key={sectionProps.label}
              setMenuSettings={setMenuSettings}
              onToggleLayer={this.onToggleLayer}
              onToggleSubCategoryCollapse={({ subCategoryId }) => {
                const prev = subCategoryGroupsSelected?.[subCategoryId];
                const next = !prev;

               

                setMenuSettings({
                  subCategoryGroupsSelected: {
                    ...subCategoryGroupsSelected,
                    [subCategoryId]: next,
                  },
                });
              }}
              subCategoryGroupsSelected={subCategoryGroupsSelected}
              onToggleGroupOption={(groupKey, groupOptionValue) => {
                setMenuSettings({
                  subCategoryGroupsSelected: {
                    ...subCategoryGroupsSelected,
                    [groupKey]: groupOptionValue,
                  },
                });
              }}
              
              mapViewerBaseUrl={mapViewerBaseUrl}
              {...props}
              {...sectionProps}
            />
          ))}
        </MenuPanel>
      </div>
    );
  }
}

MapMenu.propTypes = {
  className: PropTypes.string,
  datasetSections: PropTypes.array,
  setMenuSettings: PropTypes.func,
  loading: PropTypes.bool,
  activeDatasets: PropTypes.array,
  setMapSettings: PropTypes.func,
  isDesktop: PropTypes.bool,
  subCategoryGroupsSelected: PropTypes.object,
  mapViewerBaseUrl: PropTypes.string,
};

const selectMapViewerBaseUrl = (state) => state?.config?.links?.mapViewerBaseUrl;

const mapStateToProps = (state) => ({
  mapViewerBaseUrl: selectMapViewerBaseUrl(state),
  climateFilters: state.mapMenu?.climateFilters,
});

export default connect(mapStateToProps)(MapMenu);

