import { fetchUrlTimestamps } from "@/services/timestamps";
import { getTimeValuesFromWMS } from "@/utils/wms";
import { getNextDate, getPreviousDate } from "@/utils/time";

import { POLITICAL_BOUNDARIES_DATASET } from "@/data/datasets";
import { POLITICAL_BOUNDARIES } from "@/data/layers";
import { formatTimeLabelByTimeStep } from "@/utils/date-format";

const getLayerTime = (timestamps, currentTimeMethod) => {
  let currentTime = timestamps[timestamps.length - 1];

  switch (currentTimeMethod) {
    case "next_to_now":
      const nextDate = getNextDate(timestamps);
      if (nextDate) {
        currentTime = nextDate;
      }
      break;
    case "previous_to_now":
      const previousDate = getPreviousDate(timestamps);
      if (previousDate) {
        currentTime = previousDate;
      }
      break;
    case "latest_from_source":
      currentTime = timestamps[timestamps.length - 1];
      break;
    case "earliest_from_source":
      currentTime = timestamps[0];
      break;
    default:
      break;
  }

  return currentTime;
};

const rasterFileUpdateProvider = (layer) => {
  const {
    id: layerId,
    currentTimeMethod,
    autoUpdateInterval,
    settings = {},
    tileJsonUrl,
  } = layer;

  const { autoUpdateActive = true } = settings;

  return {
    layer: layer,
    getTimestamps: () => {
      return fetchUrlTimestamps(tileJsonUrl, "timestamps").then(
        (timestamps) => {
          return timestamps;
        }
      );
    },
    getCurrentLayerTime: (timestamps) => {
      return getLayerTime(timestamps, currentTimeMethod);
    },
    ...(!!autoUpdateInterval &&
      autoUpdateActive && {
        updateInterval: autoUpdateInterval,
      }),
  };
};

const wmsUpdateProvider = (layer) => {
  const {
    id: layerId,
    getCapabilitiesUrl,
    layerName,
    autoUpdateInterval,
    currentTimeMethod,
  } = layer;

  return {
    layer: layer,
    getCurrentLayerTime: (timestamps) => {
      return getLayerTime(timestamps, currentTimeMethod);
    },
    ...(!!autoUpdateInterval && {
      updateInterval: autoUpdateInterval,
    }),
  };
};

const tileLayerUpdateProvider = (layer) => {
  const {
    currentTimeMethod,
    autoUpdateInterval,
    settings = {},
    tileJsonUrl,
    timestampsResponseObjectKey,
  } = layer;

  const { autoUpdateActive = true } = settings;

  return {
    layer: layer,
    getTimestamps: () => {
      return fetchUrlTimestamps(tileJsonUrl, timestampsResponseObjectKey).then(
        (timestamps) => {
          return timestamps;
        }
      );
    },
    getCurrentLayerTime: (timestamps) => {
      return getLayerTime(timestamps, currentTimeMethod);
    },
    ...(!!autoUpdateInterval &&
      autoUpdateActive && {
        updateInterval: autoUpdateInterval,
      }),
  };
};

export const createUpdateProviders = (activeLayers) => {
  const providers = activeLayers.reduce((all, layer) => {
    const { layerType, multiTemporal } = layer;

    let provider;

    if (multiTemporal && layerType) {
      switch (layerType) {
        case "raster_file":
          provider = rasterFileUpdateProvider(layer);
          break;
        case "wms":
          provider = wmsUpdateProvider(layer);
          break;
        case "raster_tile":
          provider = tileLayerUpdateProvider(layer);
        case "vector_tile":
          provider = tileLayerUpdateProvider(layer);
        default:
          break;
      }
    }

    if (provider) {
      all.push(provider);
    }

    return all;
  }, []);

  return providers;
};


export const getTimeseriesConfig = (layer, analysisType) => {
  let config = layer.analysisConfig?.pointTimeseriesAnalysis;

  if (analysisType !== "point") {
    config = layer.analysisConfig?.areaTimeseriesAnalysis;
  }

  const chartType = config?.chartType || "default";
  const chartColor = config?.chartColor || "#74c476";
  const unit = config?.unit || "";

  const includeAnomaly = config?.includeAnomaly ?? true;
  const includeUncertainty = config?.includeUncertainty ?? true;

  const subType = layer.subLayerType;

  const yKeys = {};

  // Add value key depending on subType
  if (subType === "ensemble") {
   yKeys.value = {
    type: "scatter",
    yAxisId: "value",
    label: "Ensemble Mean",
   stroke: "#000000",  // black for ensemble mean
  fill: "#000000",
    r: 6, // bigger dot for ensemble
  };
  } else {
    yKeys.value = {
      type: "bar",
      yAxisId: "value",
      fill: "#4CAF50",
      stroke: "#4CAF50",
      label:
  subType === "anomaly"
    ? "Change relative to 1985-2014"
    : subType === "uncertainty"
    ? "Standard deviation of individual models about the ensemble average"
    : "Mean",
      barSize: 42,
    };
  }

  if (includeAnomaly && subType !== "anomaly") {
    yKeys.anomaly = {
      type: "bar",
      yAxisId: "value",
      fill: "#FF6666",
      stroke: "#FF6666",
      label: "Anomaly",
      barSize: 10,
    };
  }


  // Hardcoded ensemble model names
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

if (["ensemble"].includes(subType)) {
  hardcodedModelNames.forEach((modelName) => {
    yKeys[modelName] = {
      type: "scatter", 
      yAxisId: "value",
      stroke: getModelColor(modelName),
      fill: getModelColor(modelName),
      label: modelName,
      r: 3, // radius of dots
    };
  });
}


  const tooltip = [
    {
      key: "date",
      label: "Date",
      formatConfig: {
        formatDate: true,
        dateFormat: (d) =>
          formatTimeLabelByTimeStep(
            d,
            layer.metadata_properties?.time_step || "seasonal"
          ),
      },
    },
    {
      key: "value",
      label:
  subType === "anomaly"
    ? "Change"
    : subType === "uncertainty"
    ? "Standard deviation"
    : "Mean",
      formatConfig: { formatNumber: false, units: unit },
    },
  ];

  if (includeAnomaly && subType !== "anomaly") {
    tooltip.push({
      key: "anomaly",
      label: "Anomaly",
      formatConfig: { formatNumber: false, units: unit },
    });
  }

  
  if (["ensemble"].includes(subType)) {
    hardcodedModelNames.forEach((modelName) => {
      tooltip.push({
        key: modelName,
        label: modelName,
        formatConfig: { formatNumber: false, units: unit },
      });
    });
  }

  return {
    widget: `widget-${layer.id}`,
    layerId: layer.id,
    datasetId: layer.dataset,
    title: `${layer.name}`,
    categories: [""],
    types: ["country", "geostore", "point", "aoi", "use"],
    admins: ["adm0", "adm1", "adm2"],
    large: true,
    metaKey: "",
    sortOrder: {},
    visible: ["analysis"],
    chartType: "composedChart",
    colors: "weather",
    sentences: {},
    settings: {
      time: "",
    },
    refetchKeys: ["time"],
    requiresTime: true,
    datasets: [
      {
        dataset: POLITICAL_BOUNDARIES_DATASET,
        layers: [POLITICAL_BOUNDARIES],
        boundary: true,
      },
      {
        dataset: layer.dataset,
        layers: [layer.id],
      },
    ],
    plotConfig: {
      title: layer.name || null,
      subType: layer.subLayerType || null,
      simpleNeedsAxis: true,
      height: 300,
      unit,
      yKeys,
      xKey: "date",
      yAxis: {
        yAxisId: "value",
        domain: ["auto", "auto"],
      },
      xAxis: {
        dataKey: "date",
        tickDateFormat: (d) =>
          formatTimeLabelByTimeStep(
            d,
            layer.metadata_properties?.time_step || "seasonal"
          ),
      },
      tooltip,
    },
  };
};

// Optional utility to assign consistent colors per model
const getModelColor = (modelName) => {
  const colorMap = {
    "BCC-CSM2-MR": "#1f77b4",
    "CanESM5": "#ff7f0e",
    "CMCC-ESM2": "#2ca02c",
    "EC-Earth3": "#d62728",
    "GFDL-ESM4": "#9467bd",
    "INM-CM5-0": "#8c564b",
    "IPSL-CM6A-LR": "#e377c2",
    "MPI-ESM1-2-HR": "#7f7f7f",
  };

  return colorMap[modelName] || "#999";
};




