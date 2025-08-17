import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import maxBy from "lodash/maxBy";
import max from "lodash/max";
import cx from "classnames";
import html2canvas from "html2canvas";
import downloadIcon from "@/assets/icons/download.svg?sprite";
import Icon from "@/components/ui/icon";
import { ticks as d3ticks } from "d3-array";
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
  Scatter,
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

    getFullTitle = () => {
    const base = this.props.config?.title || "Chart";
    const loc = this.props.analysisTitleText || "";
    return loc ? `${base} — ${loc}` : base;
  };

    slugify = (s) =>
    String(s)
      .replace(/[\/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 180);

downloadChartAsImage = () => {
  if (!this.chartRef) return;
  const fullTitle = this.getFullTitle();

  // Create title
  const titleEl = document.createElement("h3");
  titleEl.textContent = fullTitle;
  titleEl.style.textAlign = "center";
  titleEl.style.marginBottom = "10px";
  titleEl.style.fontSize = "14px";
  titleEl.style.fontWeight = "bold";

  // padding left & right
titleEl.style.padding = "0 16px";           // shorthand: top/bottom 0, left/right 16px
// or:
// titleEl.style.paddingLeft = "16px";
// titleEl.style.paddingRight = "16px";

// (optional) keep width consistent with container
titleEl.style.width = "100%";
titleEl.style.boxSizing = "border-box";

  // Insert title at top
  this.chartRef.insertBefore(titleEl, this.chartRef.firstChild);

  // Save original height
  const originalHeight = this.chartRef.style.height;
  // Increase height for capture
  this.chartRef.style.height = "auto";

  html2canvas(this.chartRef, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: 2,
  }).then((canvas) => {
    // Remove title
    this.chartRef.removeChild(titleEl);
    // Restore original height
    this.chartRef.style.height = originalHeight;

    // Download
    const link = document.createElement("a");
    link.download = `${this.slugify(fullTitle)}.png`;
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
        uncertainty: true,
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

     // Determine enabled series on main y axis
    const enabledKeys = Object.entries(yKeys)
      .filter(([k, cfg]) => enabledLines[k] && (cfg.yAxisId || "value") === "value")
      .map(([k]) => k);

    // Only affect charts where all enabled series are scatter
    const isScatterOnly =
      enabledKeys.length > 0 &&
      enabledKeys.every((k) => (yKeys[k]?.type || "").toLowerCase() === "scatter");

    // Collect values for enabled series
    const values = [];
    for (const k of enabledKeys) {
      for (const row of data || []) {
        const v = row?.[k];
        if (v != null) values.push(v);
      }
    }

    const dataMin = values.length ? Math.min(...values) : 0;
    const dataMax = values.length ? Math.max(...values) : 0;

    const onlyPositive   = values.length > 0 && dataMin > 0;   // all > 0
    const allNonNegative = values.length > 0 && dataMin >= 0;  // all ≥ 0
    const allNonPositive = values.length > 0 && dataMax <= 0;  // all ≤ 0

    // Domain logic:
    // - Scatter-only: if all positive, start at min; otherwise keep config/default
    // - Bars/lines: if all ≥ 0 => [0, "auto"]; if all ≤ 0 => ["auto", 0]; else keep auto↔auto
    const computedYAxisProps = { ...(yAxis || {}) };
    if (isScatterOnly) {
      if (onlyPositive) {
        computedYAxisProps.domain = ["dataMin", "auto"];
      }
    } else {
      if (allNonNegative) {
        computedYAxisProps.domain = [0, "auto"];
      } else if (allNonPositive) {
        computedYAxisProps.domain = ["auto", 0];
      } // else: keep whatever was configured (often ["auto","auto"])
    }

    // Zero line visibility:
    // - bars/lines with a 0 baseline, or data crosses zero
    const showZeroRef =
      (!isScatterOnly && (allNonNegative || allNonPositive)) ||
      (values.length > 0 && dataMin <= 0 && dataMax >= 0);

    const zeroIfOverflow = isScatterOnly ? "discard" : "extendDomain";

    // ---- Ticks & formatting (scatter-only explicit ticks) ----
    let yTicks;
    if (isScatterOnly && dataMax > dataMin) {
      const lo = onlyPositive ? dataMin : Math.min(0, dataMin);
      const hi = dataMax;
      const desired = 6;
      yTicks = d3ticks(lo, hi, desired);
      if (!Array.isArray(yTicks) || yTicks.length < 2) {
        yTicks = [lo, hi];
      }
    }

    const approxSpan = Math.abs(dataMax - dataMin) || 1;
    const step =
      Array.isArray(yTicks) && yTicks.length > 1
        ? Math.abs(yTicks[1] - yTicks[0])
        : approxSpan / 5;

    const decimalsFromStep = (s) => {
      if (!(s > 0)) return 0;
      const d = Math.ceil(-Math.log10(s));
      return Math.min(Math.max(d, 0), 6);
    };

    let decimals = decimalsFromStep(step);

    let computedUnitFormat =
      isScatterOnly
        ? (v) => format(`.${decimals}f`)(v)
        : (
            unitFormat ||
            ((v) => {
              if (!isFinite(v)) return "";
              const span = approxSpan;
              if (span < 0.01) return format(".4f")(v);
              if (span < 0.1)  return format(".3f")(v);
              if (span < 1)    return format(".2f")(v);
              return format(".2s")(v);
            })
          );

    if (isScatterOnly && Array.isArray(yTicks)) {
      let tries = 0;
      while (tries < 3) {
        const lbls = new Set(yTicks.map((v) => computedUnitFormat(v)));
        if (lbls.size === yTicks.length) break;
        decimals = Math.min(decimals + 1, 6);
        computedUnitFormat = (v) => format(`.${decimals}f`)(v);
        tries += 1;
      }
    }

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
          style={{ height: config?.height || 250 }}
        >
          <ResponsiveContainer width="99%">
            <ComposedChart
              data={data}
              margin={
                margin || {
                  top: 30,
                  right: rightMargin,
                  left: simpleNeedsAxis ? 15 : 15,
                  bottom: 0,
                }
              }
              stackOffset={stackOffset || "none"}
              barGap={-30} // tighter bars
              barCategoryGap="10%" 
              padding={{ left: 20 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
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

              <XAxis
                dataKey={xKey || ""}
                axisLine={true}
                tickLine={true}
                tick={{ dy: 8, fontSize: simple ? "10px" : "12px", fill: "#555555" }}
                interval="preserveStartEnd"
                {...xAxis}
              />

              {(!simple || simpleNeedsAxis) && (
              <YAxis
                axisLine={true}
                tickLine={true}
                //strokeDasharray="3 4"
                tickSize={-2}
                tickMargin={25} // Give space between ticks and axis
                {...computedYAxisProps}
                ticks={yTicks}
                allowDecimals
                tick={
                  <CustomTick
                    dataMax={maxYValue}
                   unitFormat={computedUnitFormat}
                    fill="#555555"
                    vertical={false}
                  />
                }
                label={{
                  value: unit, // e.g., "mm"
                  angle: -90,
                  position: "insideLeft",
                  offset: 12,
                  style: { fill: "#666", fontSize: 12 }
                }}
              
              />

              )}

              {rightYAxis && (
                <YAxis
                  orientation="right"
                  tick={
                    <CustomTick
                      dataMax={maxYValue}
                      unit={rightYAxis.unit || unit}
                      unitFormat={computedUnitFormat}
                      fill="#555555"
                      vertical={false}
                    />
                  }
                  {...rightYAxis}
                />
              )}

              {!simple && cartesianGrid && (
                <CartesianGrid strokeDasharray="3 4" vertical={false} horizontal {...cartesianGrid} />
              )}

              <Legend
                iconSize={12}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  padding: "6px 12px",
                  fontSize: 12,
                  background: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  marginTop: "12px",
                }}
                              payload={Object.entries(yKeys)
                .filter(([key]) => enabledLines[key])
                .map(([key, cfg]) => ({
                  id: key,
                  type:
                    cfg.type === "bar" || cfg.type === "area"
                      ? "square"
                      : cfg.type || "line",
                  value: cfg.label || key,
                  color:
                    typeof cfg.stroke === "string" && cfg.stroke !== "none"
                      ? cfg.stroke
                      : cfg.fill || "#999",
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
           {showZeroRef && (
            <ReferenceLine
              y={0}
              yAxisId="value"
              stroke="#999"
              strokeDasharray="3 3"
              strokeWidth={1}
              ifOverflow={zeroIfOverflow}
              label={{ value: "0", position: "insideRight", fill: "#666", fontSize: 10 }}
            />
          )}

              {Object.entries(yKeys).map(([key, cfg]) => {
                if (!enabledLines[key]) return null;
                if (data.every((d) => d[key] == null)) return null;

                const commonProps = {
                  key,
                  dataKey: key,
                  yAxisId: cfg.yAxisId || "value",
                  stroke: cfg.stroke,
                  fill: cfg.fill,
                  fillOpacity: cfg.fillOpacity,
                  isAnimationActive: false,
                  dot: cfg.dot ?? false,
                  strokeDasharray: cfg.strokeDasharray,
                  barSize: cfg.barSize || 12,
                };

                switch (cfg.type) {
                  case "bar":
                    return (
                      <Bar {...commonProps}>
                        {cfg.labelList && (
                          <LabelList {...cfg.labelList}>{cfg.labelList.value}</LabelList>
                        )}
                        {cfg.itemColor &&
                          data.map((item, idx) => (
                            <Cell key={`c_${idx}_${item.color || "default"}`} fill={item.color || "#ccc"} />
                          ))}
                      </Bar>
                    );
                 case "line":
                return (
                  <Line
                    {...commonProps}
                    strokeWidth={cfg.strokeWidth ?? 2} // respect 0
                    dot={cfg.dot ?? false}             // show dots if defined
                  />
                );
                
               case "scatter":
                    return (
                      <Scatter
                        key={key}
                        dataKey={key}
                        yAxisId={cfg.yAxisId || "value"}
                        isAnimationActive={false}
                        shape={(props) => {
                          const { cx, cy } = props;
                          const radius = cfg.r || 2;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={radius}
                              fill={cfg.fill}
                              stroke={cfg.stroke || cfg.fill}
                            />
                          );
                        }}
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
  analysisTitleText: PropTypes.string,
};

export default CustomComposedChart;
