import { fetchUrlTimestamps } from "@/services/timestamps";
import { getTimeValuesFromWMS } from "@/utils/wms";
import { getNextDate, getPreviousDate } from "@/utils/time";

import { POLITICAL_BOUNDARIES_DATASET } from "@/data/datasets";
import { POLITICAL_BOUNDARIES } from "@/data/layers";
import { formatSeasonalTimeLabel } from "@/utils/date-format";

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

  const includeEnsemble = config?.includeEnsemble ?? true;
  const includeAnomaly = config?.includeAnomaly ?? true;
  const includeUncertainty = config?.includeUncertainty ?? true;


  const yKeys = {
    value: {
      type: "bar",
      yAxisId: "value",
      fill: chartColor,
      stroke: chartColor,
      label: "Mean",
      barSize: 24,
      
    },
  };

  if (includeEnsemble) {
  yKeys.ensemble = {
    type: "bar",
    yAxisId: "value",
    fill: "#6666ff", 
    barSize: 8,  
    label: "Ensemble Mean",
    
  };
}

  if (includeAnomaly) {
    yKeys.anomaly = {
      type: "line",
      stroke: "#ff6666",
      strokeDasharray: "2 2",
      label: "Anomaly",
    };
  }

  if (includeUncertainty) {
    yKeys.uncertainty_max = {
      type: "area",
      stroke: "none",
      fill: '#888',
      fillOpacity: 0.4,
      baseLineKey: "uncertainty_min",
      label: "Uncertainty Range",
    };
  }

  const tooltip = [
    {
      key: "date",
      label: "Date",
      formatConfig: {
        formatDate: true,
        dateFormat: formatSeasonalTimeLabel,
      },
    },
    {
      key: "value",
      label: "Mean",
      formatConfig: { formatNumber: true, units: unit },
    },
  ];

  if (includeEnsemble) {
    tooltip.push({
      key: "ensemble",
      label: "Ensemble Mean",
      formatConfig: { formatNumber: true, units: unit },
    });
  }

  if (includeAnomaly) {
    tooltip.push({
      key: "anomaly",
      label: "Anomaly",
      formatConfig: { formatNumber: true, units: unit },
    });
  }

  if (includeUncertainty) {
    tooltip.push(
      {
        key: "uncertainty_min",
        label: "Uncertainty Min",
        formatConfig: { formatNumber: true, units: unit },
      },
      {
        key: "uncertainty_max",
        label: "Uncertainty Max",
        formatConfig: { formatNumber: true, units: unit },
      }
    );
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
      simpleNeedsAxis: true,
      height: 250,
      unit,
      yKeys,     
      xKey: "date",
      yAxis: {
        yAxisId: "value",
        domain: ["auto", "auto"],
      },
      xAxis: {
        dataKey: "date",
        tickDateFormat: formatSeasonalTimeLabel,
      },
      tooltip,
    },
  };
};




