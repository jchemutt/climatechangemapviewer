import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";

import NoContent from "@/components/ui/no-content";
import LayerToggle from "@/components/map/components/legend/components/layer-toggle";
import DatasetSection from "./dataset-section";
import Button from "@/components/ui/button";
import { FiRotateCw, FiRefreshCcw } from "react-icons/fi";
import { connect } from "react-redux";
import { setClimateFilters } from "@/components/map-menu/actions";
import { selectLayerTimestamps } from "@/components/map-menu/selectors";
import {
  FiDroplet,
  FiClock,
  FiTrendingUp,
  FiLayers,
  FiCalendar,
  FiPercent,
  FiChevronRight,
  FiChevronDown,
  FiFilter
} from "react-icons/fi";

import "./styles.scss";
const LOCAL_STORAGE_KEY = "climateFilters";

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
     lastMatchingDatasetId: null,
     openAccordion: "variable"
     
  };

   componentDidMount() {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      this.setState({ climateFilters: parsed }, () => {
        this.props.setClimateFilters(parsed);
        this.syncDynamicSeasonTimeToLayers();
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.climateFilters !== this.state.climateFilters) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state.climateFilters));
    }
  }

handleAccordionToggle = (sectionKey) => {
  this.setState((prevState) => ({
    openAccordion: prevState.openAccordion === sectionKey ? null : sectionKey
  }));
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

    // Clone the whole climateFilters object
    const newFilters = {
      ...prevState.climateFilters,
      [key]: updated,
    };

    // Synchronize timePeriod <-> scenario
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
  }, () => {
    // Callback after state is set
    this.removeFilteredOutLayers();

    // Dispatch to Redux here
    this.props.dispatch(setClimateFilters(this.state.climateFilters));
    //console.log("DISPATCH climateFilters:", this.state.climateFilters);
    
  });
};

handleMonthSelection = (month) => {
  this.setState((prevState) => {
    const monthOptions = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const current = prevState.climateFilters.selectedMonths || [];
    const isSelected = current.includes(month);
    const monthIndex = monthOptions.indexOf(month);

    // Helper: get index of selected months
    const selectedIndices = current.map((m) => monthOptions.indexOf(m)).sort((a, b) => a - b);

    if (isSelected) {
      // Only allow deselecting from start or end of selection (circular-aware)
      const wrapSorted = [...selectedIndices];
      if (
        monthIndex === wrapSorted[0] ||
        monthIndex === wrapSorted[wrapSorted.length - 1] ||
        (wrapSorted[0] === 0 && wrapSorted[wrapSorted.length - 1] === 11 && monthIndex === 11)
      ) {
        return {
          climateFilters: {
            ...prevState.climateFilters,
            selectedMonths: current.filter((m) => m !== month),
          },
        };
      } else {
        alert("Only deselect from the start or end of your selection.");
        return null;
      }
    } else {
      // Allow adding only if adjacent to selection (circular-aware)
      if (selectedIndices.length === 0) {
        return {
          climateFilters: {
            ...prevState.climateFilters,
            selectedMonths: [month],
          },
        };
      }

      const prevIndex = (monthIndex - 1 + 12) % 12;
      const nextIndex = (monthIndex + 1) % 12;

      if (selectedIndices.includes(prevIndex) || selectedIndices.includes(nextIndex)) {
        const updated = [...current, month];
        // Sort based on circular order starting from first selected
        const sortFrom = updated.map((m) => monthOptions.indexOf(m));
        const sortedIndices = sortFrom.sort((a, b) => ((a - sortFrom[0] + 12) % 12) - ((b - sortFrom[0] + 12) % 12));
        const sorted = sortedIndices.map((i) => monthOptions[i % 12]);

        return {
          climateFilters: {
            ...prevState.climateFilters,
            selectedMonths: sorted,
          },
        };
      } else {
        alert("Please select consecutive months only (wraparound allowed).");
        return null;
      }
    }
  }, () => {
    // 
    this.props.setClimateFilters(this.state.climateFilters);

    // Optionally update map
    this.removeFilteredOutLayers();
    this.syncDynamicSeasonTimeToLayers();

    
    //console.log("DISPATCH from month selection:", this.state.climateFilters.selectedMonths);
  });
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

syncDynamicSeasonTimeToLayers = () => {

  const { activeDatasets, setMapSettings, layerTimestamps } = this.props;
  const { climateFilters } = this.state;

  const selectedMonths = climateFilters.selectedMonths || [];
  const timeStep = climateFilters.timeStep || [];

  if (!timeStep.includes("monthly_to_seasonal") || selectedMonths.length < 2) {
    return;
  }

  const monthNameToNumber = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const updatedDatasets = activeDatasets.map((dataset, index) => {
  

    const firstLayerId = Array.isArray(dataset.layers) ? dataset.layers[0] : null;
    if (!firstLayerId) {
      return dataset;
    }

    const timestamps = layerTimestamps?.[firstLayerId] || [];
  

    const selectedTimestamps = timestamps.filter((ts) => {
      const month = ts.slice(5, 7);
      return selectedMonths.some(
        (monthName) => monthNameToNumber[monthName] === month
      );
    });

    

    const usesMonthlyToSeasonal = timeStep.includes("monthly_to_seasonal");

    
    if (usesMonthlyToSeasonal && selectedTimestamps.length) {
      const dynamicTime = `dynamic-iso-${[...new Set(selectedTimestamps)].join(",")}`;
      
      return {
        ...dataset,
        params: {
          ...dataset.params,
          time: dynamicTime,
        },
      };
    }

  
    return dataset;
  });

  setMapSettings({ datasets: updatedDatasets });
};


   resetFilters = () => {
    const cleared = {
      variable: [],
      timePeriod: [],
      scenario: [],
      model: [],
      timeStep: [],
      calculation: [],
      selectedMonths: [],
    };
    this.setState({ climateFilters: cleared }, () => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      this.props.setClimateFilters(cleared);
      this.removeFilteredOutLayers();
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
        { value: "anomaly", label: "Change relative to 1985-2014" },
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
             <div className="filter-section-title">
        <FiFilter /> Filters
      </div>
  <div className="filter-actions">
    <Button className="map-btn primary-btn" onClick={this.resetFilters}>
      <FiRefreshCcw />
      Clear All Filters
    </Button>

    <Button className="map-btn secondary-btn" onClick={this.handleRefreshMap}>
      <FiRotateCw />
      Update Map View
    </Button>
  </div>

  <div className="filter-summary">
    <p className="dataset-count">
      <FiLayers style={{ marginRight: "0.4rem" }} />
      <strong>
        {
          datasets
            .filter(this.matchesFilters)
            .filter((d) => subCategories.some((sc) => sc.id === d.sub_category))
            .length
        }
      </strong>{" "}
      datasets match your filters
    </p>
  </div>


            <div className="climate-filters">

          {[
  { key: "variable", icon: <FiDroplet />, label: "Variable" },
  { key: "timePeriod", icon: <FiClock />, label: "Time Period" },
  { key: "scenario", icon: <FiTrendingUp />, label: "Scenario" },
  { key: "model", icon: <FiLayers />, label: "Model" },
  { key: "timeStep", icon: <FiCalendar />, label: "Time Step" },
  { key: "calculation", icon: <FiPercent />, label: "Calculation" }
].map(({ key, icon, label }) => (
  <Fragment key={key}>
    <div className="filter-accordion">
      <div className="accordion-header" onClick={() => this.handleAccordionToggle(key)}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {icon}
          {label}
        </span>
        <span className="accordion-toggle-icon">
          {this.state.openAccordion === key ? <FiChevronDown /> : <FiChevronRight />}
        </span>
      </div>
      {this.state.openAccordion === key && (
        <div className="checkbox-group">
          {filterOptions[key].map((opt) => (
            <label key={opt.value}>
              <input
                type={key === "timeStep" ? "radio" : "checkbox"}
                name={key}
                checked={climateFilters[key].includes(opt.value)}
                onChange={() => this.handleFilterChange(key, opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>

    {/* Show custom month selector immediately after timeStep */}
    {key === "timeStep" && climateFilters.timeStep.includes("monthly_to_seasonal") && (
      <div className="filter-accordion">
        <div className="accordion-header">
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <FiCalendar />
            Select Months
            <small style={{ color: '#666', marginLeft: '0.5rem' }}>
              (For Dynamic Seasonal Calculation)
            </small>
          </span>
          <span className="accordion-toggle-icon">
            <FiChevronDown />
          </span>
        </div>
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
      </div>
    )}
  </Fragment>
))}

            </div>
          </div>

                  <div className="data-section-title">
          <FiLayers />
          Datasets (
          {
            datasets
              .filter(this.matchesFilters)
              .filter((d) => subCategories.some((sc) => sc.id === d.sub_category))
              .length
          }
          )
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
  setClimateFilters: PropTypes.func,
};

const mapDispatchToProps = {
  setClimateFilters,
};

const mapStateToProps = (state) => ({
  layerTimestamps: selectLayerTimestamps(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(Datasets);
