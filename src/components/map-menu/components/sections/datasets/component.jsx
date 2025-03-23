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
      subCategoryGroupsSelected = {},
      
      setMenuSettings,
     
    } = this.props;

    console.log("🚀 subCategories before filtering:", subCategories);
    console.log("🚀 All datasets:", datasets);

    // ✅ Load only category id: 1 (Climate Change)
    const categoryId = 1;
    const filteredSubCategories =
      subCategories?.filter((subCat) => subCat.category === categoryId) || [];

    console.log("✅ subCategories after filtering:", filteredSubCategories);

    return (
      <div className="c-datasets">
        <Fragment>
        {filteredSubCategories
            .map((subCat) => {
              // Assign datasets to subcategory
              subCat.datasets = datasets.filter((d) => d.sub_category === subCat.id);
              return subCat;
            })
            .filter((subCat) => subCat.datasets.length > 0)
            .map((subCat) => {


            const groupKey = `${sectionId}-${subCat.id}`;
            let selectedGroup = subCategoryGroupsSelected?.[groupKey] || null;

            if (
              !selectedGroup &&
              subCat.group_options &&
              !!subCat.group_options.length
            ) {
              const defaultGroup =
                subCat.group_options.find((o) => o.default) ||
                subCat.group_options[0];

              selectedGroup = defaultGroup?.value || null;
            }

            const collapsed = subCategoryGroupsSelected?.[subCat.id] ?? false;

            return (
              <DatasetSection
              key={subCat.slug}
              sectionId={sectionId}
              {...subCat}
              collapsed={collapsed}
              onToggleCollapse={onToggleSubCategoryCollapse}
            >
              {subCat.group_options && (
                            <div className="group-options-wrapper">
                              {subCat.group_options_title && (
                                <div className="group-options-title">
                                  {subCat.group_options_title}
                                </div>
                              )}
                              <div className="group-options">
                                {subCat.group_options.map((groupOption) => {
                                  return (
                                    <div
                                      key={groupOption.value}
                                      className={cx("group-option", {
                                        active:
                                          groupOption.value === selectedGroup,
                                      })}
                                      onClick={() => {
                                        onToggleGroupOption(
                                          groupKey,
                                          groupOption.value
                                        );
                                      }}
                                    >
                                      {groupOption.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

            
              
                            {!isEmpty(subCat.datasets) ? (
                            subCat.datasets.map((d) => {
                              if (
                                d.group &&
                                subCat.group_options &&
                                !!subCat.group_options.length
                              ) {
                                if (d.group && d.group === selectedGroup) {
                                  return (
                                    <LayerToggle
                                      key={d.id}
                                      className="dataset-toggle"
                                      data={{ ...d, dataset: d.id }}
                                      onToggle={onToggleLayer}
                                      onInfoClick={setModalMetaSettings}
                                      showSubtitle
                                      category={categoryId}
                                    />
                                  );
                                } else {
                                  return null;
                                }
                              }

                              return (
                                <LayerToggle
                                  key={d.id}
                                  className="dataset-toggle"
                                  data={{ ...d, dataset: d.id }}
                                  onToggle={onToggleLayer}
                                  onInfoClick={setModalMetaSettings}
                                  showSubtitle
                                  category={categoryId}
                                />
                              );
                            })
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
  subCategoryGroupsSelected: PropTypes.object,
  name: PropTypes.string,
  selectedCountries: PropTypes.array,
  countries: PropTypes.array,
  setMenuSettings: PropTypes.func,
  countriesWithoutData: PropTypes.array,
  setMapSettings: PropTypes.func,
  activeDatasets: PropTypes.array,
  isDesktop: PropTypes.bool,
  handleRemoveCountry: PropTypes.func,
  handleAddCountry: PropTypes.func,
  datasetCategory: PropTypes.string,
  datasetCategories: PropTypes.array,
  menuSection: PropTypes.string,
};

export default Datasets;
