import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

import ComposedChart from '@/components/charts/composed-chart';
import Brush from '@/components/charts/brush-chart';
import Legend from '@/components/charts/components/chart-legend';

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
    showEnsemble: false,
    showAnomaly: false,
    showUncertainty: false,
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
    this.setState((prevState) => ({
      [key]: !prevState[key],
    }));
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
    const { showEnsemble, showAnomaly, showUncertainty } = this.state;
    const showLegendSettingsBtn =
      settingsConfig &&
      settingsConfig.some((conf) => conf.key === 'compareYear');

      // Check if relevant keys exist in data
    const hasEnsemble = data?.some((d) => 'ensemble' in d && d.ensemble !== null);
    const hasAnomaly = data?.some((d) => 'anomaly' in d && d.anomaly !== null);
    const hasUncertainty = data?.some((d) => 'uncertainty' in d && d.uncertainty !== null);

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

          {(hasEnsemble || hasAnomaly || hasUncertainty) && (
            <div className="chart-toggles" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {hasEnsemble && (
          <label><input type="checkbox" checked={showEnsemble} onChange={() => this.handleToggle('showEnsemble')} /> Ensemble</label>
        )}
        {hasAnomaly && (
          <label><input type="checkbox" checked={showAnomaly} onChange={() => this.handleToggle('showAnomaly')} /> Anomaly</label>
        )}
        {hasUncertainty && (
          <label><input type="checkbox" checked={showUncertainty} onChange={() => this.handleToggle('showUncertainty')} /> Uncertainty</label>
        )}
      </div>
        )}

        <ComposedChart
          className="loss-chart"
          data={data}
          config={{
            ...config,
            showEnsemble,
            showAnomaly,
            showUncertainty,
          }}
          enabledLines={{
            value: true,
            ensemble: showEnsemble,
            anomaly: showAnomaly,
            uncertainty_min: showUncertainty,
            uncertainty_max: showUncertainty,
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
