import React, { Component } from "react";
import PropTypes from "prop-types";

import Icon from "@/components/ui/icon";
import DateTimePicker from "./components/datepicker";
import Button from "@/components/ui/button";
import cx from "classnames";

import { defined } from "@/utils/core";

import prevIcon from "@/assets/icons/prev.svg?sprite";
import nextIcon from "@/assets/icons/next.svg?sprite";
import refreshIcon from "@/assets/icons/auto-update.svg?sprite";

import { formatTimeLabelByTimeStep,dFormatter } from "@/utils/date-format";


import "./styles.scss";

class DateTimeSelectorSection extends Component {
  state = {
    isOpen: false,
  };

  changeDateTime = (time) => {
    this.props.onChange(time.toISOString());
  };

  onPreviousButtonClicked = () => {
    const { availableDates } = this.props;
    const currentTimeIndex = this.getCurrentTimeIndex();
    if (
      defined(currentTimeIndex) &&
      defined(availableDates[currentTimeIndex - 1])
    ) {
      this.changeDateTime(new Date(availableDates[currentTimeIndex - 1]));
    }
  };

  onNextButtonClicked = () => {
    const { availableDates } = this.props;
    const currentTimeIndex = this.getCurrentTimeIndex();
    if (
      defined(currentTimeIndex) &&
      defined(availableDates[currentTimeIndex + 1])
    ) {
      this.changeDateTime(new Date(availableDates[currentTimeIndex + 1]));
    }
  };

  onOpen = () => {
    this.setState({
      isOpen: true,
    });
  };

  onClose = () => {
    this.setState({
      isOpen: false,
    });
  };

  toggleOpen = (event) => {
    this.setState({
      isOpen: !this.state.isOpen,
    });
    event.stopPropagation();
  };

  isPreviousTimeAvaliable = () => {
    const { availableDates } = this.props;
    const currentTimeIndex = this.getCurrentTimeIndex();

    if (
      defined(currentTimeIndex) &&
      defined(availableDates[currentTimeIndex - 1])
    ) {
      return false;
    }
    return true;
  };

  isNextTimeAvaliable = () => {
    const { availableDates } = this.props;
    const currentTimeIndex = this.getCurrentTimeIndex();

    if (
      defined(currentTimeIndex) &&
      defined(availableDates[currentTimeIndex + 1])
    ) {
      return false;
    }

    return true;
  };

  getCurrentTimeIndex = () => {
    const { availableDates, selectedTime } = this.props;

    return availableDates.findIndex((d) => d === selectedTime);
  };

  getDynamicSeasonLabel = (filters) => {
    const climateFilters = filters || this.props.climateFilters;

    //console.log("DEBUG - climateFilters.selectedMonths:", climateFilters?.selectedMonths);
    const monthMap = {
      Jan: "J",
      Feb: "F",
      Mar: "M",
      Apr: "A",
      May: "M",
      Jun: "J",
      Jul: "J",
      Aug: "A",
      Sep: "S",
      Oct: "O",
      Nov: "N",
      Dec: "D",
    };
    if (!climateFilters?.selectedMonths?.length) return null;
    return climateFilters.selectedMonths.map((m) => monthMap[m] || "").join("");
  };

    componentDidUpdate(prevProps) {
  const { climateFilters, timeStep, selectedTime, onChange } = this.props;

  const prevUseDynamicSeason =
    prevProps.climateFilters?.timeStep?.includes("monthly_to_seasonal") &&
    prevProps.timeStep === "monthly";

  const useDynamicSeason =
    climateFilters?.timeStep?.includes("monthly_to_seasonal") &&
    timeStep === "monthly";

  const prevLabel = prevUseDynamicSeason
    ? this.getDynamicSeasonLabel(prevProps.climateFilters)
    : prevProps.selectedTime;

  const currLabel = useDynamicSeason
    ? this.getDynamicSeasonLabel(climateFilters)
    : selectedTime;

  if (
    useDynamicSeason &&
    prevLabel !== currLabel &&
    typeof onChange === "function"
  ) {
    onChange(currLabel || "Custom Season");
  }
}



  render() {
    let discreteTime;
    let format;

    const {
      selectedTime,
      availableDates,
      dateFormat,
      autoUpdate,
      autoUpdateActive,
      onToggleAutoUpdate,
      timeStep,
      climateFilters,
    } = this.props;

    //console.log("DEBUG - climateFilters timestep:", climateFilters?.timeStep);
    //console.log("DEBUG - layer timestep:", timeStep); 


    const useDynamicSeason =
      climateFilters?.timeStep?.includes("monthly_to_seasonal") &&
      timeStep === "monthly";

      //console.log("useDynamicSeason:",useDynamicSeason);

    if (useDynamicSeason) {
      discreteTime = this.getDynamicSeasonLabel() || "Custom Season";
    
    } else if (defined(selectedTime)) {
      const time = selectedTime;
      if (defined(dateFormat.currentTime)) {
        format = dateFormat;
        discreteTime = formatTimeLabelByTimeStep(selectedTime, timeStep);
      } else {
        discreteTime = formatDateTime(time);
      }
    }

    if (!defined(availableDates) || availableDates.length === 0) {
      return null;
    }

    const dates = availableDates.map((d) => new Date(d));

    return (
      <div className="datetimeSelector">
        <div className="datetimeSelectorInner">
          <div className={cx("datetimeAndPicker", { small: autoUpdate })}>
            <button
              className="datetimePrevious"
              disabled={useDynamicSeason || this.isPreviousTimeAvaliable()}
              onClick={this.onPreviousButtonClicked}
              title="Previous Time"
            >
              <Icon icon={prevIcon} />
            </button>
            <button
              className="currentDate"
              onClick={this.toggleOpen}
              title="Select a time"
            >
              {defined(discreteTime) ? discreteTime : "Time out of range"}
            </button>
            <button
              className="datetimeNext"
              disabled={useDynamicSeason || this.isNextTimeAvaliable()}
              onClick={this.onNextButtonClicked}
              title="Next Time"
            >
              <Icon icon={nextIcon} />
            </button>
          </div>
         {!useDynamicSeason && (
            <div title="Select a Time">
              <DateTimePicker
                currentDate={new Date(selectedTime)}
                dates={dates}
                onChange={this.changeDateTime}
                openDirection="down"
                isOpen={this.state.isOpen}
                showCalendarButton={false}
                onOpen={this.onOpen}
                onClose={this.onClose}
                dateFormat={(d) => formatTimeLabelByTimeStep(d, timeStep)}
              />
            </div>
          )}
                  </div>
        {autoUpdate && (
          <Button
            theme="theme-button-clear"
            className={cx("datetimeToggleAutoUpdate", {
              active: autoUpdateActive,
            })}
            tooltip={{ text: "Toggle auto-update" }}
            onClick={onToggleAutoUpdate}
          >
            <Icon icon={refreshIcon} className="auto-update-icon" />
          </Button>
        )}
      </div>
    );
  }
}

DateTimeSelectorSection.propTypes = {
  availableDates: PropTypes.array,
  selectedTime: PropTypes.string,
  timeStep: PropTypes.string,
  climateFilters: PropTypes.object,
};

export default DateTimeSelectorSection;
