import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import startCase from "lodash/startCase";
import { trackEvent } from "@/utils/analytics";

import MenuTile from "../menu-tile";

import "./styles.scss";

class MenuDesktop extends PureComponent {
  render() {
    const { className, datasetSections, setMenuSettings } = this.props;

    return (
      <div className={cx("c-menu-desktop", className)}>
        <ul className="datasets-menu">
          {/* ✅ Only allow switching between dataset and analysis sections */}
          {datasetSections &&
            datasetSections.map((s) => (
              <MenuTile
                className="datasets-tile"
                key={`${s.slug}_${s.category}`}
                {...s}
                label={s.category}
                onClick={() => {
                  setMenuSettings({
                    datasetCategory: s.active ? s.category : s.category,
                    menuSection: s.active ? "datasets" : s.slug, // ✅ Keeps menu open
                  });
                  if (!s.active) {
                    trackEvent({
                      category: "Map menu",
                      action: "Select Map menu",
                      label: s.slug,
                    });
                  }
                }}
              />
            ))}
        </ul>
      </div>
    );
  }
}

MenuDesktop.propTypes = {
  datasetSections: PropTypes.array,
  setMenuSettings: PropTypes.func,
  className: PropTypes.string,
};

export default MenuDesktop;
