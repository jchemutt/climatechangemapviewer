import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { useSpring, animated, config } from "@react-spring/web";
import useMeasure from "react-use-measure";

import Icon from "@/components/ui/icon";

import layersIcon from "@/assets/icons/layers.svg?sprite";
import arrowDown from "@/assets/icons/arrow-down.svg?sprite";
import arrowUp from "@/assets/icons/arrow-up.svg?sprite";

import "./styles.scss";

const DatasetSection = ({
  title,
  subTitle,
  children,
  datasets,
  onToggleCollapse = () => {}, // ✅ Ensure it always has a default value
  collapsed,
  sectionId,
  id: subCategoryId,
}) => {
  const [measureRef, { height }] = useMeasure();

  const styles = useSpring({
    config: config.default,
    from: { height: 0 },
    to: { height: !collapsed ? height : 0 },
  });

  const activeDatasetsCount =
    datasets && datasets.filter((d) => d.active).length;

  return (
    <div className={cx("c-dataset-section", { collapsed })}>
      {(title || subTitle) && (
        <div className="dataset-header">
          {title && (
            <div
              className="title-wrapper"
              onClick={() =>
                onToggleCollapse
                  ? onToggleCollapse({
                      sectionId,
                      subCategoryId,
                      settings: { collapsed: !collapsed },
                    })
                  : null // ✅ Prevent calling an undefined function
              }
            >
              <div className="title">
                <Icon className="category-icon" icon={layersIcon} />
                {collapsed && !!activeDatasetsCount && (
                  <div className="dataset-count">{activeDatasetsCount}</div>
                )}
                <div>{title}</div>
              </div>
              <div className="collapse-icon">
                <Icon icon={collapsed ? arrowDown : arrowUp} />
              </div>
            </div>
          )}
          {subTitle && <div className="subtitle">{subTitle}</div>}
        </div>
      )}

      <animated.div style={{ overflow: "hidden", ...styles }}>
        <div ref={measureRef} className="datasets-list">{children}</div>
      </animated.div>
    </div>
  );
};

DatasetSection.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  children: PropTypes.node,
  onToggleCollapse: PropTypes.func, // ✅ Ensure prop type is a function
  collapsed: PropTypes.bool,
  sectionId: PropTypes.string,
  id: PropTypes.string,
};

export default DatasetSection;
