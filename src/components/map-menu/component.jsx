import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { trackEvent } from "@/utils/analytics";

import MenuPanel from "./components/menu-panel";
import MenuDesktop from "./components/menu-desktop";

import "./styles.scss";

class MapMenu extends PureComponent {

  componentDidMount() {
    this.initializeSubCategoryCollapseState();
  }
  componentDidUpdate(prevProps) {
    const { comparing, activeDatasets, activeCompareSide, setMapSettings } =
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
        datasets: [...newActiveDatasets], // ✅ Ensure immutability
      });
    }
  }

  initializeSubCategoryCollapseState = () => {
    const {
      datasetSections,
      activeDatasets,
      subCategoryGroupsSelected,
      setMenuSettings,
    } = this.props;
  
    console.log("🔥 Initializing subcategory collapse state...");
    console.log("📦 datasetSections:", datasetSections);
    console.log("📦 activeDatasets:", activeDatasets);
    console.log("📦 Existing subCategoryGroupsSelected:", subCategoryGroupsSelected);
  
    const newCollapseState = {};
  
    datasetSections.forEach((section) => {
      section.subCategories?.forEach((subCat) => {
        const subCatDatasets = section.datasets?.filter(
          (d) => d.sub_category === subCat.id
        );
  
        const hasInitialVisible = subCatDatasets?.some((d) => d.initialVisible);
        const hasActive = subCatDatasets?.some((d) =>
          activeDatasets?.some((ad) => ad.dataset === d.id)
        );
  
        const collapsed = !(hasInitialVisible || hasActive);
        newCollapseState[subCat.id] = collapsed;
  
        console.log(`🧩 Subcategory ${subCat.title} (id: ${subCat.id}):`);
        console.log("    - hasInitialVisible:", hasInitialVisible);
        console.log("    - hasActive:", hasActive);
        console.log("    - collapsed:", collapsed);
      });
    });
  
    const updatedCollapseState = {
      ...subCategoryGroupsSelected,
      ...Object.fromEntries(
        Object.entries(newCollapseState).filter(
          ([key]) => !(key in subCategoryGroupsSelected)
        )
      ),
    };
  
    console.log("✅ Final collapse state to set:", updatedCollapseState);
  
    setMenuSettings({ subCategoryGroupsSelected: updatedCollapseState });
  };
  
  

  onToggleLayer = (data, enable) => {
    const { activeDatasets, activeCompareSide, setMapSettings } = this.props;
    const { dataset, layer } = data;

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
      datasets: [...newActiveDatasets], // ✅ Ensure immutability
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
          active={true} // ✅ Forces the dataset menu to stay open
          isDesktop={isDesktop}
          loading={loading}
          onClose={() => { /* ❌ Disable menu closing */ }}
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
              
                console.log(`🔁 Toggling subcategory [${subCategoryId}] from ${prev} to ${next}`);
              
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
};

export default MapMenu;
