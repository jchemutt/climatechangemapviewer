import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";

import NoContent from "@/components/ui/no-content";
import LayerToggle from "@/components/map/components/legend/components/layer-toggle";
import DatasetSection from "./dataset-section";
import Button from "@/components/ui/button";


import "./styles.scss";

class Datasets extends PureComponent {
  state = {
    climateFilters: {
      variable: [],
      timePeriod: [],
      scenario: [],
      model: [],
      calculation: [],
      timeStep: [],
    },
  };

  handleFilterChange = (key, value) => {
    this.setState((prevState) => {
      const current = prevState.climateFilters[key] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        climateFilters: {
          ...prevState.climateFilters,
          [key]: updated,
        },
      };
    });
  };

   handleRefreshMap = () => {
    const { mapViewerBaseUrl } = this.props;
    if (mapViewerBaseUrl) {
      window.location = mapViewerBaseUrl;
    } else {
      window.location.reload();
    }
  };

  resetFilters = () => {
    this.setState({
      climateFilters: {
        variable: [],
        timePeriod: [],
        scenario: [],
        model: [],
        calculation: [],
        timeStep: [],
      },
    });
  };

  matchesFilters = (dataset) => {
    const { climateFilters } = this.state;
    const { variable, timePeriod, scenario, model, calculation, timeStep } = climateFilters;

    const metadata = dataset.metadata_properties || {};

    return (
      (!variable.length || variable.includes(metadata.variable)) &&
      (!timePeriod.length || timePeriod.includes(metadata.time_period)) &&
      (!scenario.length || scenario.includes(metadata.scenario)) &&
      (!model.length || model.includes(metadata.model)) &&
      (!calculation.length || calculation.includes(metadata.calculation)) &&
      (!timeStep.length || timeStep.includes(metadata.time_step))
    );
  };

  render() {
    const {
      datasets,
      subCategories,
      onToggleLayer,
      setModalMetaSettings,
      onToggleSubCategoryCollapse,
      subCategoryGroupsSelected = {},
      id: sectionId,
      setMenuSettings,
    } = this.props;

    const { climateFilters } = this.state;

    
    
    const categoryId = 1;
    const filteredSubCategories = subCategories?.filter((subCat) => subCat.category === categoryId) || [];

    const filterOptions = {
      variable: [
        { value: "total_rainfall", label: "Total Rainfall" },
        { value: "mean_air_temperature", label: "Mean Air Temperature" },
        { value: "minimum_air_temperature", label: "Minimum Air Temperature" },
        { value: "maximum_air_temperature", label: "Maximum Air Temperature" },
      ],
      timePeriod: [
        { value: "1985-2014", label: "1985–2014" },
        { value: "2021-2050", label: "2021–2050" },
        { value: "2071-2100", label: "2071–2100" },
      ],
      scenario: [
        { value: "ssp1-2.6", label: "SSP1-2.6" },
        { value: "ssp2-4.5", label: "SSP2-4.5" },
        { value: "historical", label: "Historical" },
      ],
      model: [
        { value: "BCC-CSM2-MR", label: "BCC-CSM2-MR" },
        { value: "CanESM5", label: "CanESM5" },
        { value: "CMCC-ESM2", label: "CMCC-ESM2" },
        { value: "Ensemble", label: "Ensemble" },
      ],
      calculation: [
        { value: "mean", label: "Mean" },
        { value: "anomaly", label: "Anomaly" },
        { value: "uncertainty", label: "Uncertainty" },
      ],
      timeStep: [ 
        { value: "seasonal", label: "Seasonal" },
      ],
    };

    const displayName = {
      variable: "Variable",
      timePeriod: "Time Period",
      scenario: "Scenario",
      model: "Model",
      calculation: "Calculation",
      timeStep: "Time Step",
    };

    return (
      <div className="c-datasets">
        <Fragment>
          { ( <div className="sticky-filters">
            <div className="climate-filters">
           <Button className="map-btn" onClick={this.handleRefreshMap}>
            🔄 Refresh Map
          </Button>

          <Button className="map-btn" onClick={this.resetFilters}>
            ♻️ Reset Filters
          </Button>
    
              {["variable", "timePeriod", "scenario", "model", "calculation", "timeStep"].map((filterKey) => (
                <details key={filterKey} className="filter-accordion">
                  <summary>{displayName[filterKey]}</summary>
                  <div className="checkbox-group">
                    {filterOptions[filterKey].map((opt) => (
                      <label key={opt.value}>
                        <input
                          type="checkbox"
                          checked={climateFilters[filterKey].includes(opt.value)}
                          onChange={() => this.handleFilterChange(filterKey, opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </details>
              ))}
            </div></div>
          )}
    
          {/* Now only render DatasetSections below */}
          {filteredSubCategories
            .map((subCat) => {
              subCat.datasets = datasets.filter((d) => d.sub_category === subCat.id);
              return subCat;
            })
            .filter((subCat) => subCat.datasets.length > 0)
            .map((subCat) => {
              const groupKey = `${sectionId}-${subCat.id}`;
              let selectedGroup = subCategoryGroupsSelected?.[groupKey] || null;
    
              if (!selectedGroup && subCat.group_options?.length) {
                const defaultGroup = subCat.group_options.find((o) => o.default) || subCat.group_options[0];
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
                  {!isEmpty(subCat.datasets) ? (
                    subCat.datasets
                      .filter(this.matchesFilters)
                      .map((d) => (
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
                    <NoContent className="no-datasets" message="No datasets available" />
                  )}
                </DatasetSection>
              );
            })}
        </Fragment>
      </div>
    );
    ;
  }
}

Datasets.propTypes = {
  datasets: PropTypes.array,
  onToggleLayer: PropTypes.func,
  setModalMetaSettings: PropTypes.func,
  subCategories: PropTypes.array,
  id: PropTypes.string,
  subCategoryGroupsSelected: PropTypes.object,
  setMenuSettings: PropTypes.func,
  mapViewerBaseUrl: PropTypes.string,
};

export default Datasets;
