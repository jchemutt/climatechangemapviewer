import React from "react";
import PropTypes from "prop-types";
import dynamic from "next/dynamic";

import Modal from "@/components/modal";
import Icon from "@/components/ui/icon";
import DynamicSentence from "@/components/ui/dynamic-sentence";
import Button from "@/components/ui/button";

import arrowDownIcon from "@/assets/icons/move-left.svg?sprite";

// Dynamically import Widgets to avoid SSR issues
const Widgets = dynamic(() => import("@/components/widgets"), { ssr: false });
//import "./styles.scss";

const AnalysisModal = ({
  onClose,
  zoomLevel,
  hasWidgets,
  analysisTitle,
  clearAnalysis,
}) => (
  <Modal
    open={true}
    onRequestClose={() => {
      clearAnalysis(); // Optional: close + clear from modal close button
    }}
    className="analysis-popup-modal"
  >
    {/* Clickable Title that clears analysis */}
    {analysisTitle && (
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

    {/* Widgets content */}
    {hasWidgets ? <Widgets simple analysis /> : <p>No results available.</p>}

    {/* Disclaimer */}
    <div className="disclaimers">
      {zoomLevel < 11 && (
        <p>
          The results are approximated by sampling the selected area.
          Results are more accurate at closer zoom levels.
        </p>
      )}
    </div>
  </Modal>
);

AnalysisModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number,
  hasWidgets: PropTypes.bool,
  analysisTitle: PropTypes.node,
  clearAnalysis: PropTypes.func.isRequired,
};

export default AnalysisModal;
