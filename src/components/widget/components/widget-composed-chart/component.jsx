import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

import ComposedChart from '@/components/charts/composed-chart';
import Brush from '@/components/charts/brush-chart';
import Legend from '@/components/charts/components/chart-legend';

const hardcodedModelNames = [
  "BCC-CSM2-MR",
  "CanESM5",
  "CMCC-ESM2",
  "EC-Earth3",
  "GFDL-ESM4",
  "INM-CM5-0",
  "IPSL-CM6A-LR",
  "MPI-ESM1-2-HR",
];

const meanLabelMap = {
  model_mean: 'Mean',
  ensemble: 'Ensemble',
  anomaly: 'Anomaly',
  uncertainty: 'Uncertainty'
};

const ensembleLabelMap = {
  model_mean: 'Ensemble Mean',
  ensemble: 'Models Means',
  uncertainty: 'Model Means'
};

class WidgetComposedChart extends Component {
  static propTypes = {
    originalData: PropTypes.array,
    data: PropTypes.array,
    config: PropTypes.object,
    settings: PropTypes.object,
    settingsConfig: PropTypes.array,
    preventRenderKeys: PropTypes.array,
    handleSetInteraction: PropTypes.func,
    handleChangeSettings: PropTypes.func,
    parseInteraction: PropTypes.func,
    active: PropTypes.bool,
    simple: PropTypes.bool,
    barBackground: PropTypes.string,
    toggleSettingsMenu: PropTypes.func,
  };

  static defaultProps = {
    preventRenderKeys: [],
  };

  state = {
    showMean: true,
    showEnsemble: false,
    showAnomaly: false,
    showUncertainty: true,
  };

  handleMouseMove = debounce((data) => {
    const { parseInteraction, handleSetInteraction } = this.props;
    if (parseInteraction && handleSetInteraction) {
      const { activePayload } = data && data;
      if (activePayload && activePayload.length) {
        const interaction = parseInteraction(activePayload[0].payload);
        handleSetInteraction(interaction);
      }
    }
  }, 100);

  handleMouseLeave = debounce(() => {
    const { handleSetInteraction, parseInteraction } = this.props;
    if (parseInteraction && handleSetInteraction) {
      handleSetInteraction(null);
    }
  }, 100);

  handleBrushEnd = ({ startIndex, endIndex }) => {
    const { originalData, handleChangeSettings } = this.props;

    if (handleChangeSettings) {
      const dataEnd =
        originalData[endIndex] || originalData[originalData.length - 1];

      handleChangeSettings({
        startIndex,
        endIndex,
        startDateAbsolute: originalData[startIndex]?.date,
        endDateAbsolute: dataEnd.date,
      });
    }
  };

 handleToggle = (key) => {
  this.setState((prevState) => {
    const isTurningOn = !prevState[key];

    // If turning ON Anomaly, turn OFF the rest
    if (key === 'showAnomaly' && isTurningOn) {
      return {
        showAnomaly: true,
        showMean: false,
        showEnsemble: false,
        showUncertainty: false,
      };
    }

    // If turning ON any of the others, turn OFF Anomaly
    if (
      ['showMean', 'showEnsemble', 'showUncertainty'].includes(key) &&
      isTurningOn
    ) {
      return {
        ...prevState,
        [key]: true,
        showAnomaly: false,
      };
    }

    // Default toggle for OFF action
    return {
      ...prevState,
      [key]: !prevState[key],
    };
  });
};


  render() {
    const {
      originalData,
      data,
      config,
      settingsConfig,
      active,
      simple,
      barBackground,
      toggleSettingsMenu,
    } = this.props;
    const { brush, legend } = config;
    const { showMean,showEnsemble, showAnomaly, showUncertainty } = this.state;
    const subType = config?.subType || 'model_mean';
    const showLegendSettingsBtn =
      settingsConfig &&
      settingsConfig.some((conf) => conf.key === 'compareYear');

      // Check if relevant keys exist in data
    const hasMean = data?.some((d) => 'value' in d && d.value !== null);
    const hasEnsemble = data?.some((d) => 'ensemble' in d && d.ensemble !== null);
    const hasAnomaly = data?.some((d) => 'anomaly' in d && d.anomaly !== null);
    const hasUncertainty =
      data?.some((d) =>
        ('uncertainty_min' in d && d.uncertainty_min !== null) ||
        ('uncertainty_max' in d && d.uncertainty_max !== null)
      );

      const hasModelLines = data?.some((d) =>
      hardcodedModelNames.some((model) => d[model] !== undefined && d[model] !== null)
    );

    const modelEnabledLines = {};
        if (['ensemble', 'uncertainty'].includes(subType) && hasModelLines) {
        hardcodedModelNames.forEach((model) => {
          modelEnabledLines[model] = showEnsemble;
        });
      }
          const meanLabel = meanLabelMap[subType] || 'Mean';
    const ensembleLabel = ensembleLabelMap[subType] || 'Ensemble Mean';
    return (
      <div className="c-widget-composed-chart">
        {!simple && legend && (
          <Legend
            data={data}
            config={legend}
            simple={simple}
            toggleSettingsMenu={showLegendSettingsBtn && toggleSettingsMenu}
          />
        )}

 <div
  className="chart-toggles"
  style={{
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: '0.85rem', 
  }}
>

  {hasMean && subType !== 'uncertainty' && (
    <label
      title="Show or hide the Model Mean line"
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
    >
      <input
        type="checkbox"
        checked={showMean}
        onChange={() => this.handleToggle('showMean')}
      />
      <span style={{ color: '#4caf50' }}>{meanLabel}</span>
    </label>
  )}

  {subType === 'uncertainty' && hasUncertainty && (
  <label
    title="Show or hide the Uncertainty range"
    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
  >
    <input
      type="checkbox"
      checked={showUncertainty}
      onChange={() => this.handleToggle('showUncertainty')}
    />
    <span style={{ color: '#888' }}>Uncertainty Range</span>
  </label>
)}

      {['ensemble', 'uncertainty'].includes(subType) ? (
        <label
          title="Show or hide the Ensemble Mean line"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <input
            type="checkbox"
            checked={showEnsemble}
            onChange={() => this.handleToggle('showEnsemble')}
          />
          <span style={{ color: '#6666ff' }}>{ensembleLabel}</span>
        </label>
      ) : null}

  

  
</div>


        <ComposedChart
          className="loss-chart"
          data={data}
          config={{
            ...config,
            showMean,
            showEnsemble,
            showAnomaly,
            showUncertainty,
          }}
          enabledLines={{
            value: subType !== 'uncertainty' && showMean,
            ensemble: showEnsemble,
            anomaly: showAnomaly,
            uncertainty_min: showUncertainty,
            uncertainty_max: showUncertainty,
            uncertainty: showUncertainty, 
            ...modelEnabledLines
          }}
          backgroundColor={active ? '#fefedc' : ''}
          barBackground={barBackground}
          simple={simple}
          active={active}
          handleMouseMove={this.handleMouseMove}
          handleMouseLeave={this.handleMouseLeave}
        />

        {!simple && brush && (
          <Brush
            {...brush}
            data={originalData}
            onBrushEnd={this.handleBrushEnd}
          />
        )}
      </div>
    );
  }
}

export default WidgetComposedChart;
