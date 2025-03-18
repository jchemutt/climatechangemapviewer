import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";

import NoContent from "@/components/ui/no-content";
import LayerToggle from "@/components/map/components/legend/components/layer-toggle";

import DatasetSection from "./dataset-section";

import "./styles.scss";

class Datasets extends PureComponent {
  render() {
    const {
      datasets,
      subCategories,
      onToggleLayer,
      setModalMetaSettings,
      onToggleSubCategoryCollapse,
      onToggleGroupOption,
      id: sectionId,
      subCategoryGroupsSelected = {}, // ✅ Ensure it always has a default value
    } = this.props;

    console.log("🚀 subCategories before filtering:", subCategories);
    subCategories.forEach((subCat) => {
      console.log(`📌 Subcategory "${subCat.title}"`, subCat);
      if (!subCat.datasets || subCat.datasets.length === 0) {
        console.warn(`⚠️ No datasets found in subcategory "${subCat.title}" (ID: ${subCat.id})`);
      }
    });

    // ✅ Load only category id: 1 (Climate Change)
    const categoryId = 1;
    const filteredSubCategories =
      subCategories?.filter((subCat) => subCat.category === categoryId) || [];

      console.log("✅ subCategories after filtering:", filteredSubCategories);

    return (
      <div className="c-datasets">
        <Fragment>
          {filteredSubCategories.map((subCat) => {
            const groupKey = `${sectionId}-${subCat.id}`;
            let selectedGroup = subCategoryGroupsSelected?.[groupKey] || null; // ✅ Ensure safe access

            if (
              !selectedGroup &&
              subCat.group_options &&
              !!subCat.group_options.length
            ) {
              const defaultGroup =
                subCat.group_options.find((o) => o.default) ||
                subCat.group_options[0];

              selectedGroup = defaultGroup?.value || null; // ✅ Ensure safe access
            }

            return (
              <DatasetSection
                key={subCat.slug}
                sectionId={sectionId}
                {...subCat}
                onToggleCollapse={onToggleSubCategoryCollapse}
              >
                {!isEmpty(subCat.datasets) ? (
                  subCat.datasets.map((d) => (
                    <LayerToggle
                      key={d.id}
                      className="dataset-toggle"
                      data={{ ...d, dataset: d.id }}
                      onToggle={onToggleLayer}
                      onInfoClick={setModalMetaSettings}
                      showSubtitle
                      category={categoryId}
                    />
                  ))
                ) : (
                  <NoContent
                    className="no-datasets"
                    message="No datasets available"
                  />
                )}
              </DatasetSection>
            );
          })}
        </Fragment>
      </div>
    );
  }
}

Datasets.propTypes = {
  datasets: PropTypes.array,
  onToggleLayer: PropTypes.func,
  setModalMetaSettings: PropTypes.func,
  subCategories: PropTypes.array,
  id: PropTypes.string,
  subCategoryGroupsSelected: PropTypes.object, // ✅ Ensure prop type is an object
};

export default Datasets;
