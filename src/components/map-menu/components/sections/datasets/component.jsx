import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";

import NoContent from "@/components/ui/no-content";
import LayerToggle from "@/components/map/components/legend/components/layer-toggle";
import DatasetSection from "./dataset-section";
import Button from "@/components/ui/button";
import { FiRotateCw, FiRefreshCcw } from "react-icons/fi";

import "./styles.scss";

class Datasets extends PureComponent {
  state = {
    climateFilters: {
      variable: [],
      timePeriod: [],
      scenario: [],
      model: [],
      timeStep: [],
      calculation: [],
      selectedMonths: [],
    },
     lastMatchingDatasetId: null
  };



  handleFilterChange = (key, value) => {
  this.setState((prevState) => {
    const current = prevState.climateFilters[key] || [];
    let updated;

    // Handle radio buttons for timeStep
    if (key === "timeStep") {
      updated = current.includes(value) ? [] : [value];
    } else {
      updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
    }

    // Clone the whole climateFilters object to modify related fields
    const newFilters = {
      ...prevState.climateFilters,
      [key]: updated,
    };

    // Synchronize 1985–2014 <-> historical
    const isAdding = !current.includes(value);

    if (key === "timePeriod" && value === "1985-2014") {
      if (isAdding) {
        newFilters["scenario"] = [...new Set([...newFilters["scenario"], "historical"])];
      } else {
        newFilters["scenario"] = newFilters["scenario"].filter((v) => v !== "historical");
      }
    }

    if (key === "scenario" && value === "historical") {
      if (isAdding) {
        newFilters["timePeriod"] = [...new Set([...newFilters["timePeriod"], "1985-2014"])];
      } else {
        newFilters["timePeriod"] = newFilters["timePeriod"].filter((v) => v !== "1985-2014");
      }
    }

    return { climateFilters: newFilters };
  }, this.removeFilteredOutLayers);
};


  handleMonthSelection = (month) => {
    this.setState((prevState) => {
      const current = prevState.climateFilters.selectedMonths || [];
      const updated = current.includes(month)
        ? current.filter((m) => m !== month)
        : [...current, month];

      return {
        climateFilters: {
          ...prevState.climateFilters,
          selectedMonths: updated,
        },
      };
    }, this.removeFilteredOutLayers);
  };

removeFilteredOutLayers = () => {
  const { datasets, activeDatasets, setMapSettings } = this.props;

  const filteredActive = activeDatasets.filter((active) => {
    const fullDataset =
      datasets.find((d) => d.id === active.id || d.id === active.dataset || d.dataset === active.dataset);

    if (active.dataset === "political-boundaries") return true;

    return fullDataset && this.matchesFilters(fullDataset);
  });

  setMapSettings({ datasets: filteredActive });
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
        timeStep: [],
        calculation: [],
        selectedMonths: [],
      },
    });
  };

  matchesFilters = (dataset) => {
    const { climateFilters } = this.state;
    const { variable, timePeriod, scenario, model, timeStep, calculation } = climateFilters;

    const metadata = dataset.metadata_properties || {};
    const isMonthlyToSeasonal = timeStep.includes("monthly_to_seasonal");
    const isMonthlyDataset = metadata.time_step === "monthly";

    return (
      (!variable.length || variable.includes(metadata.variable)) &&
      (!timePeriod.length || timePeriod.includes(metadata.time_period)) &&
      (!scenario.length || scenario.includes(metadata.scenario)) &&
      (!model.length || model.includes(metadata.model)) &&
      (!timeStep.length || timeStep.includes(metadata.time_step) || (isMonthlyToSeasonal && isMonthlyDataset)) &&
      (!calculation.length || calculation.includes(metadata.calculation))
    );
  };

  renderActiveFilters = () => {
  const { climateFilters } = this.state;
  const displayLabels = {
    variable: "Variable",
    timePeriod: "Time Period",
    scenario: "Scenario",
    model: "Model",
    timeStep: "Time Step",
    calculation: "Calculation",
    selectedMonths: "Months",
  };

  return (
    <div className="active-filters">
      {Object.entries(climateFilters).flatMap(([key, values]) =>
        values.map((value) => (
          <span className="filter-badge" key={`${key}-${value}`}>
            {displayLabels[key] || key}: {value}
            <button onClick={() => this.handleFilterChange(key, value)}>×</button>
          </span>
        ))
      )}
    </div>
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
        { value: "precipitation", label: "Precipitation" },
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
        { value: "ssp2-4.0", label: "SSP2-4.0" },
        { value: "ssp2-4.5", label: "SSP2-4.5" },
        { value: "ssp3-7.0", label: "SSP3-7.0" },
        { value: "ssp5-8.5", label: "SSP5-8.5" },
        { value: "historical", label: "Historical" },
      ],
      model: [
        { value: "BCC-CSM2-MR", label: "BCC-CSM2-MR" },
        { value: "CanESM5", label: "CanESM5" },
        { value: "CMCC-ESM2", label: "CMCC-ESM2" },
        { value: "EC-Earth3", label: "EC-Earth3" },
        { value: "GFDL-ESM4", label: "GFDL-ESM4" },
        { value: "INM-CM5-0", label: "INM-CM5-0" },
        { value: "IPSL-CM6A-LR", label: "IPSL-CM6A-LR" },
        { value: "MPI-ESM1-2-HR", label: "MPI-ESM1-2-HR" },
        { value: "Ensemble", label: "Ensemble" },
      ],
      timeStep: [
        { value: "monthly", label: "Monthly (Jan-Dec)" },
        { value: "seasonal", label: "Seasonal (MAM,JJAS,OND)" },
        
        { value: "monthly_to_seasonal", label: "Seasonal (Dynamic)" },
        
        
      ],
      calculation: [
        { value: "mean", label: "Mean" },
        { value: "anomaly", label: "Anomaly" },
        { value: "stddev", label: "Stddev (Uncertainty)" },
      ],
    };

    const displayName = {
      variable: "Variable",
      timePeriod: "Time Period",
      scenario: "Scenario",
      model: "Model",
      timeStep: "Time Step",
      calculation: "Calculation",
    };

    const showMonthSelector = climateFilters.timeStep.includes("monthly_to_seasonal");
    const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
      <div className="c-datasets">
        <Fragment>
          <div className="sticky-filters">
            {this.renderActiveFilters()}
            <p style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
            <strong>
              {
                datasets.filter(this.matchesFilters).filter((d) =>
                  subCategories.some((sc) => sc.id === d.sub_category)
                ).length
              }
            </strong> datasets match your filters
          </p>

                <div className="filter-actions">
            <Button className="map-btn primary-btn" onClick={this.resetFilters}>
              <FiRefreshCcw />
              Reset Filters
            </Button>

            <Button className="map-btn secondary-btn" onClick={this.handleRefreshMap}>
              <FiRotateCw />
              Refresh Map
            </Button>
          </div>
            <div className="climate-filters">

           {["variable", "timePeriod", "scenario", "model", "timeStep", "calculation"].map((filterKey) => (
            <Fragment key={filterKey}>
              <details className="filter-accordion" open={filterKey === "variable"}>
                <summary>{displayName[filterKey]}</summary>
                <div className="checkbox-group">
                  {filterOptions[filterKey].map((opt) => (
                    <label key={opt.value}>
                      <input
                        type={filterKey === "timeStep" ? "radio" : "checkbox"}
                        name={filterKey}
                        checked={climateFilters[filterKey].includes(opt.value)}
                        onChange={() => this.handleFilterChange(filterKey, opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </details>

              {/* Show Custom Season UI immediately after timeStep filter */}
              {filterKey === "timeStep" && climateFilters.timeStep.includes("monthly_to_seasonal") && (
                <details className="filter-accordion" open>
                  <summary>Select Months
                     <small style={{ marginLeft: '0.5rem', color: '#666' }}>(For Dynamic Seasonal Calculation)</small>
                  </summary>
                  <div className="month-grid">
                    {monthOptions.map((month) => (
                      <label key={month} className="month-item">
                        <input
                          type="checkbox"
                          checked={climateFilters.selectedMonths.includes(month)}
                          onChange={() => this.handleMonthSelection(month)}
                        />
                        {month}
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </Fragment>
          ))}

            </div>
          </div>

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
