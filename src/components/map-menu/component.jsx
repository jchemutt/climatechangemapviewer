import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import remove from "lodash/remove";
import { trackEvent } from "@/utils/analytics";

import MenuPanel from "./components/menu-panel";
import MenuDesktop from "./components/menu-desktop";

import "./styles.scss";

class MapMenu extends PureComponent {
  componentDidUpdate(prevProps) {
    const { comparing, activeDatasets, activeCompareSide, setMapSettings } =
      this.props;
    const { comparing: prevComparing } = prevProps;

    // Ensure all existing layers stay on the default map side
    if (prevComparing !== comparing) {
      let newActiveDatasets = [...activeDatasets];

      const datasets = newActiveDatasets.map((d) => ({
        ...d,
        mapSide: activeCompareSide,
      }));

      setMapSettings({
        datasets: datasets,
      });
    }
  }

  onToggleLayer = (data, enable) => {
    const { activeDatasets, activeCompareSide } = this.props;
    const { dataset, layer } = data;

    let newActiveDatasets = [...activeDatasets];
    if (!enable) {
      newActiveDatasets = remove(
        newActiveDatasets,
        (l) => l.dataset !== dataset
      );
    } else {
      newActiveDatasets = [
        {
          dataset,
          opacity: 1,
          visibility: true,
          layers: [layer],
          ...(activeCompareSide && {
            mapSide: activeCompareSide,
          }),
        },
      ].concat([...newActiveDatasets]);
    }

    this.props.setMapSettings({
      datasets: newActiveDatasets || [],
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
      menuSection,
      loading,
      isDesktop,
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
                onToggleLayer={this.onToggleLayer}
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
  menuSection: PropTypes.string,
  isDesktop: PropTypes.bool,
};

export default MapMenu;
