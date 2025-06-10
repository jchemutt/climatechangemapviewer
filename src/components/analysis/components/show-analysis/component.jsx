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
    error: PropTypes.string,
    analysisTitle: PropTypes.object,
    analysisDescription: PropTypes.object,
    handleShowDownloads: PropTypes.func,
    setMenuSettings: PropTypes.func,
    showDownloads: PropTypes.bool,
    hasLayers: PropTypes.bool,
    widgetLayers: PropTypes.array,
    downloadUrls: PropTypes.array,
    zoomLevel: PropTypes.number,
    showAnalysisDisclaimer: PropTypes.bool,
    location: PropTypes.object,
    geostore: PropTypes.object,
    layers: PropTypes.array,
  };

  state = {
    analysisModalOpen: false,
  };

   componentDidUpdate(prevProps, prevState) {
  const { widgetLayers } = this.props;
  const { analysisModalOpen } = this.state;

  const prevWidgetLayers = prevProps.widgetLayers || [];
  const currWidgetLayers = widgetLayers || [];

  const widgetsChanged =
    JSON.stringify(prevWidgetLayers) !== JSON.stringify(currWidgetLayers);

  const nowHasWidgets = currWidgetLayers.length > 0;

  const wasClosed = prevState.analysisModalOpen === false;

  if (widgetsChanged && nowHasWidgets) {
    this.setState({ analysisModalOpen: true });
  } else if (wasClosed && nowHasWidgets && !analysisModalOpen) {
    this.setState({ analysisModalOpen: true });
  }
}


handleCloseModal = () => {
  
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
      zoomLevel,
      analysisTitle,
      analysisDescription,
      layers,
      location,
      geostore,
    } = this.props;

    const { analysisModalOpen } = this.state;

    const hasWidgets = widgetLayers && !!widgetLayers.length;
    
   

    const layersWithFeatureInfoAnalysis = layers.filter(
      (l) =>
        l.analysisConfig &&
        (l.analysisConfig.pointInstanceAnalysis ||
          l.analysisConfig.areaInstanceAnalysis)
    );

    const hasLayersWithFeatureInfo =
      layersWithFeatureInfoAnalysis && !!layersWithFeatureInfoAnalysis.length;

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

            {hasLayersWithFeatureInfo && (
              <LayersFeatureInfo
                location={location}
                layers={layersWithFeatureInfoAnalysis}
                geostore={geostore}
              />
            )}

            {!hasAnalysisLayers && !hasWidgets && !loading && (
              <NoContent>Select a data layer to analyze.</NoContent>
            )}

            {/* REMOVE INLINE WIDGETS VIEW */}
            {/* {(hasAnalysisLayers || hasWidgets) && !loading && !error && (
              <Fragment>
                <Widgets simple analysis />
                <div className="disclaimers">
                  {zoomLevel < 11 && (
                    <p>
                      The results are approximated by sampling the selected
                      area. Results are more accurate at closer zoom levels.
                    </p>
                  )}
                </div>
              </Fragment>
            )} */}
          </div>
        </div>

       {!loading && !error && analysisModalOpen && (
  <AnalysisModal
    onClose={this.handleCloseModal}
    zoomLevel={zoomLevel}
    hasWidgets={hasWidgets}
    analysisTitle={analysisTitle}
    clearAnalysis={() => {
      clearAnalysis(); 
      this.setState({ analysisModalOpen: false }); // closes modal
    }}
  />
)}
      </div>
    );
  }
}

export default ShowAnalysis;
