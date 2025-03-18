import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import MenuTile from "../menu-tile";

import "./styles.scss";

class MenuMobile extends PureComponent {
  render() {
    const { className, sections, setMenuSettings } = this.props;

    return (
      <ul className={cx("c-menu-mobile", className)}>
        {sections &&
          sections
            .filter((s) => ["datasets", "analysis"].includes(s.slug)) // ✅ Only allow datasets & analysis
            .map((s) => (
              <MenuTile
                small
                key={s.slug}
                {...s}
                highlight={s.highlight}
                onClick={() =>
                  setMenuSettings({
                    menuSection: s.active ? "datasets" : s.slug, // ✅ Prevents closing the menu
                  })
                }
              />
            ))}
      </ul>
    );
  }
}

MenuMobile.propTypes = {
  sections: PropTypes.array,
  setMenuSettings: PropTypes.func,
  className: PropTypes.string,
  loading: PropTypes.bool,
};

export default MenuMobile;
