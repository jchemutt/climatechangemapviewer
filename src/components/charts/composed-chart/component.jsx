import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import maxBy from "lodash/maxBy";
import max from "lodash/max";
import cx from "classnames";
import html2canvas from "html2canvas";
import downloadIcon from "@/assets/icons/download.svg?sprite";
import Icon from "@/components/ui/icon";
import {
  Line,
  Bar,
  Cell,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  LabelList,
  Legend,
} from "recharts";

import ChartToolTip from "../components/chart-tooltip";
import CustomTick from "./custom-tick-component";
import CustomBackground from "./custom-background-component";

import "./styles.scss";

class CustomComposedChart extends PureComponent {
  chartRef = null;
  findMaxValue = (data, config) => {
    const yKeys = config?.yKeys || {};
    const maxValues = [];

    Object.keys(yKeys).forEach((key) => {
      const isStacked = yKeys[key].stackId === 1;
      if (isStacked) {
        const stackedMax = max(
          data.map((d) =>
            Object.keys(yKeys).reduce((acc, k) => acc + (d[k] || 0), 0)
          )
        );
        maxValues.push(stackedMax);
      } else {
        const maxValue = maxBy(data, key)?.[key];
        if (maxValue != null) maxValues.push(maxValue);
      }
    });

    return max(maxValues);
  };

  getFilteredTooltip = (tooltip, enabledLines, data) => {
    return (tooltip || []).filter((t) => {
      const key = t.key;
      return enabledLines[key] && data.some((d) => d[key] != null);
    });
  };

  downloadChartAsImage = () => {
    if (!this.chartRef) return;
    html2canvas(this.chartRef, {
      useCORS: true,
      backgroundColor: "#ffffff",
      scale: 2,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  render() {
    const {
      className,
      data,
      config,
      simple,
      handleMouseMove,
      handleMouseLeave,
      handleClick,
      enabledLines = {
        value: true,
        ensemble: true,
        anomaly: true,
        uncertainty_min: true,
        uncertainty_max: true,
      },
    } = this.props;

    const {
      xKey,
      xAxis,
      yAxis,
      cartesianGrid,
      rightYAxis,
      gradients,
      tooltip,
      tooltipParseData,
      unit,
      unitFormat,
      height,
      margin,
      referenceLine,
      stackOffset,
      simpleNeedsAxis = false,
      simpleLegend,
    } = config;
    
    const yKeys = config?.yKeys || {};
    const filteredTooltip = this.getFilteredTooltip(tooltip, enabledLines, data);

    const maxYValue = this.findMaxValue(data, config);

    let rightMargin = 0;
    if (!simple && rightYAxis) rightMargin = 70;

    return (
      <div>
      <button
  onClick={this.downloadChartAsImage}
  title="Download chart"
  style={{
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
  }}
>
  <Icon icon={downloadIcon} />
</button>


        <div
          ref={(ref) => (this.chartRef = ref)}
          className={cx("c-composed-chart", className)}
          style={{ height: simple ? 110 : height || 250 }}
        >
        <ResponsiveContainer width="99%">
          <ComposedChart
            data={data}
            margin={
              margin || {
                top: !simple ? 15 : 0,
                right: rightMargin,
                left: simpleNeedsAxis ? 42 : 42,
                bottom: 0,
              }
            }
            stackOffset={stackOffset || "none"}
            padding={{ left: 50 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {/* Gradients if any */}
            <defs>
              {gradients &&
                Object.keys(gradients).map((key) => (
                  <linearGradient key={`lg_${key}`} {...gradients[key].attributes}>
                    {Object.keys(gradients[key].stops).map((sKey) => (
                      <stop key={`st_${sKey}`} {...gradients[key].stops[sKey]} />
                    ))}
                  </linearGradient>
                ))}
            </defs>

            {/* X Axis */}
            <XAxis
              dataKey={xKey || ""}
              axisLine={false}
              tickLine={false}
              tick={{ dy: 8, fontSize: simple ? "10px" : "12px", fill: "#555555" }}
              interval="preserveStartEnd"
              {...xAxis}
            />

            {/* Y Axis */}
            {(!simple || simpleNeedsAxis) && (
              <YAxis
                axisLine={false}
                tickLine={false}
                strokeDasharray="3 4"
                tickSize={-42}
                mirror
                tickMargin={0}
                tick={
                  <CustomTick
                    dataMax={maxYValue}
                    unit={unit}
                    unitFormat={
                      unitFormat ||
                      ((value) => (value < 1 ? format(".2r")(value) : format(".2s")(value)))
                    }
                    fill="#555555"
                    vertical={false}
                  />
                }
                {...yAxis}
              />
            )}

            {rightYAxis && (
              <YAxis
                orientation="right"
                tick={
                  <CustomTick
                    dataMax={maxYValue}
                    unit={rightYAxis.unit || unit}
                    unitFormat={unitFormat}
                    fill="#555555"
                    vertical={false}
                  />
                }
                {...rightYAxis}
              />
            )}

            {/* Grid */}
            {!simple && cartesianGrid && (
              <CartesianGrid strokeDasharray="3 4" vertical={false} horizontal {...cartesianGrid} />
            )}

            <Legend
              iconSize={8}
              verticalAlign="top"
              wrapperStyle={{ fontSize: 11 }}
              payload={Object.entries(yKeys)
                .filter(([key]) => enabledLines[key])
                .map(([key, cfg]) => ({
                  id: key,
                  type: cfg.type === "area" ? "square" : cfg.type || "line",
                  value: cfg.label || key,
                  color: cfg.stroke || cfg.fill || "#999",
                }))}
            />

            <Tooltip
              offset={100}
              cursor={{
                opacity: 0.5,
                stroke: "#d6d6d9",
                strokeWidth: `${1.2 * ((100 / data.length) || 1)}%`,
              }}
              content={<ChartToolTip settings={filteredTooltip} parseData={tooltipParseData} />}
            />

            {referenceLine && <ReferenceLine {...referenceLine} />}

            {/* Render Bars/Lines/Areas */}
            {Object.entries(yKeys).map(([key, cfg]) => {
              if (!enabledLines[key]) {
                
                return null;
              }

              const isAllNull = data.every((d) => d[key] == null);
              if (isAllNull) {
               
                return null;
              }

              const commonProps = {
                key,
                dataKey: key,
                yAxisId: cfg.yAxisId || "value",
                stroke: cfg.stroke,
                fill: cfg.fill,
                fillOpacity: cfg.fillOpacity,
                isAnimationActive: false,
                dot: false,
                strokeDasharray: cfg.strokeDasharray,
              };

              switch (cfg.type) {
                case "bar":
                  return (
                    <Bar {...commonProps} {...cfg}>
                      {cfg.labelList && (
                        <LabelList {...cfg.labelList}>
                          {cfg.labelList.value}
                        </LabelList>
                      )}
                      {cfg.itemColor &&
                        data.map((item, idx) => (
                          <Cell key={`c_${idx}_${item.color || "default"}`} fill={item.color || "#ccc"} />
                        ))}
                    </Bar>
                  );
                case "line":
                  return <Line {...commonProps} strokeWidth={2} />;
                case "area":
                  return (
                    <Area
                      {...commonProps}
                      baseLine={
                        key === "uncertainty_max" && data.some((d) => d["uncertainty_min"] != null)
                          ? (dataPoint) => dataPoint["uncertainty_min"]
                          : undefined
                      }
                    />
                  );
                default:
                  console.warn(`❓ Unknown chart type for key "${key}":`, cfg.type);
                  return null;
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      </div>
    );
  }
}


CustomComposedChart.propTypes = {
  data: PropTypes.array,
  config: PropTypes.object,
  className: PropTypes.string,
  simple: PropTypes.bool,
  handleMouseMove: PropTypes.func,
  handleMouseLeave: PropTypes.func,
  handleClick: PropTypes.func,
  barBackground: PropTypes.object,
  enabledLines: PropTypes.object,
};

export default CustomComposedChart;
