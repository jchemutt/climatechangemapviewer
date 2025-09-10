import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";
import dynamic from "next/dynamic";

import Icon from "@/components/ui/icon";
import NoContent from "@/components/ui/no-content";
import Button from "@/components/ui/button";
import Widgets from "@/components/widgets";
import DynamicSentence from "@/components/ui/dynamic-sentence";
import LayersFeatureInfo from "./layers-feature-info";

import arrowDownIcon from "@/assets/icons/arrow-down.svg?sprite";
import shareIcon from "@/assets/icons/share.svg?sprite";

// Dynamically import modal to prevent SSR issues
const AnalysisModal = dynamic(() => import("./AnalysisModal"), { ssr: false });

import "./styles.scss";

const isServer = typeof window === "undefined";

class ShowAnalysis extends PureComponent {
  static propTypes = {
    data: PropTypes.array,
    setShareModal: PropTypes.func,
    clearAnalysis: PropTypes.func,
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    analysisTitle: PropTypes.object,
    analysisTitleText: PropTypes.string,
    analysisDescription: PropTypes.object,
    handleShowDownloads: PropTypes.func,
    setMenuSettings: PropTypes.func,
    showDownloads: PropTypes.bool,
    hasLayers: PropTypes.bool,
    widgetLayers: PropTypes.array,      // array (original path)
    hasWidgetLayers: PropTypes.bool,    // boolean (when parent passes only a flag)
    downloadUrls: PropTypes.array,
    zoomLevel: PropTypes.number,
    showAnalysisDisclaimer: PropTypes.bool,
    location: PropTypes.object,
    geostore: PropTypes.object,
    layers: PropTypes.array,
  };

  static defaultProps = {
    data: [],
    hasLayers: false,
    widgetLayers: undefined,
    hasWidgetLayers: undefined,
    loading: false,
    error: false,
    layers: [],
  };

  state = {
    analysisModalOpen: false,
  };

  componentDidMount() {
    const { loading, error } = this.props;
    const hasWidgetsNow = this.computeHasWidgets(this.props);
    if (hasWidgetsNow && !loading && !error) {
      this.setState({ analysisModalOpen: true });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { loading, error } = this.props;
    const { analysisModalOpen } = this.state;

    const hasWidgetsPrev = this.computeHasWidgets(prevProps);
    const hasWidgetsNow = this.computeHasWidgets(this.props);

    const widgetsArrayPrev = prevProps.widgetLayers || [];
    const widgetsArrayNow = this.props.widgetLayers || [];
    const widgetsChanged =
      Array.isArray(prevProps.widgetLayers) &&
      Array.isArray(this.props.widgetLayers) &&
      JSON.stringify(widgetsArrayPrev) !== JSON.stringify(widgetsArrayNow);

    const loadingFinished = prevProps.loading && !loading;
    const widgetsJustAppeared = !hasWidgetsPrev && hasWidgetsNow;

    if (widgetsChanged && hasWidgetsNow) {
      if (!analysisModalOpen) this.setState({ analysisModalOpen: true });
      return;
    }

    if (widgetsJustAppeared && !loading && !error && !analysisModalOpen) {
      this.setState({ analysisModalOpen: true });
      return;
    }

    if (loadingFinished && hasWidgetsNow && !error && !analysisModalOpen) {
      this.setState({ analysisModalOpen: true });
    }
  }

  computeHasWidgets = (props) => {
    if (Array.isArray(props.widgetLayers)) {
      return props.widgetLayers.length > 0;
    }
    if (typeof props.hasWidgetLayers === "boolean") {
      return props.hasWidgetLayers;
    }
    return false;
    // handles both prop styles:
    // 1) widgetLayers: [] (array from store)
    // 2) hasWidgetLayers: true/false (boolean flag from parent)
  };

  handleCloseModal = () => {
    // Keep your original behavior: close modal and clear analysis state
    this.setState({ analysisModalOpen: false });
    this.props.clearAnalysis();
  };

  render() {
    const {
      setShareModal,
      clearAnalysis,
      data,
      loading,
      error,
      hasLayers,
      widgetLayers,
      hasWidgetLayers,
      zoomLevel,
      analysisTitle,
      analysisTitleText,
      analysisDescription,
      layers,
      location,
      geostore,
    } = this.props;

    const { analysisModalOpen } = this.state;

    const hasWidgets = this.computeHasWidgets(this.props);

    const layersWithFeatureInfoAnalysis = (layers || []).filter(
      (l) =>
        l.analysisConfig &&
        (l.analysisConfig.pointInstanceAnalysis ||
          l.analysisConfig.areaInstanceAnalysis)
    );

    const hasLayersWithFeatureInfo =
      layersWithFeatureInfoAnalysis &&
      layersWithFeatureInfoAnalysis.length > 0;

    const hasAnalysisLayers = hasLayers || hasLayersWithFeatureInfo;

    return (
      <div className="c-show-analysis">
        <div className="show-analysis-body">
          {analysisTitle && !loading && !error && (
            <div className="draw-title">
              <Button
                className="title-btn left"
                theme="theme-button-clear"
                onClick={clearAnalysis}
              >
                <Icon icon={arrowDownIcon} className="icon-arrow" />
                <DynamicSentence
                  className="analysis-title"
                  sentence={analysisTitle}
                />
              </Button>
            </div>
          )}

          {analysisDescription && !loading && !error && (
            <DynamicSentence
              className="analysis-desc"
              sentence={analysisDescription}
            />
          )}

          <div className="results">
            {hasAnalysisLayers &&
              !hasLayersWithFeatureInfo &&
              !hasWidgets &&
              !loading &&
              !error &&
              isEmpty(data) && (
                <NoContent message="No analysis data available" />
              )}

            {/*hasLayersWithFeatureInfo && (
              <LayersFeatureInfo
                location={location}
                layers={layersWithFeatureInfoAnalysis}
                geostore={geostore}
              />
            )*/}

            {!hasAnalysisLayers && !hasWidgets && !loading && (
              <NoContent>Select a data layer to analyze.</NoContent>
            )}

            {/* Inline widgets intentionally removed */}
          </div>
        </div>

        {!loading && !error && analysisModalOpen && (
          <AnalysisModal
            onClose={this.handleCloseModal}
            zoomLevel={zoomLevel}
            hasWidgets={hasWidgets}
            analysisTitle={analysisTitle}
            analysisTitleText={analysisTitleText}
            clearAnalysis={() => {
              clearAnalysis();
              this.setState({ analysisModalOpen: false });
            }}
          />
        )}
      </div>
    );
  }
}

export default ShowAnalysis;
