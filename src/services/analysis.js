import request from "@/utils/request";

import { CMS_API } from "@/utils/apis";
import { parseISO } from "date-fns";

export const fetchRasterPixelValue = ({ layerId, lat, lng, time }) => {
  const params = {
    time: time,
    x: lng,
    y: lat,
  };

  return request
    .get(`${CMS_API}/raster-data/pixel/${layerId}`, { params })
    .then((res) => res?.data.value);
};

export const fetchRasterGeostoreValue = ({
  layerId,
  geostoreId,
  time,
  valueType,
}) => {
  const params = {
    time: time,
    geostore_id: geostoreId,
    value_type: valueType,
  };

  return request
    .get(`${CMS_API}/raster-data/geostore/${layerId}`, { params })
    .then((res) => res?.data);
};

export const fetchRasterPixelTimeseriesValue = ({
  layerId,
  lat,
  lng,
  startTime,
}) => {
  const params = {
    x: lng,
    y: lat,
    time_from: startTime,
  };

  return request
    .get(`${CMS_API}/raster-data/pixel/timeseries/${layerId}`, { params })
    .then((res) => res?.data)
    .then((data) => data.sort((a, b) => parseISO(a.date) - parseISO(b.date)));
};


export const fetchRasterGeostoreTimeseriesValue = async ({
  layerId,
  geostoreId,
  startTime,
  valueType,
  time,
}) => {
  const params = {
    geostore_id: geostoreId,
    time_from: startTime,
    value_type: valueType,
    time: time,
  };
console.log('Time',time)
  const response = await request.get(
    `${CMS_API}/raster-data/geostore/timeseries/${layerId}`,
    { params }
  );

  const {
    base = [],
    ensemble = [],
    anomaly = [],
    uncertainty = [],
    ensemble_models = {},
  } = response.data || {};

  const isDynamic = time?.startsWith("dynamic-iso-");
  const ensembleMap = Object.fromEntries((ensemble || []).map((d) => [d.date, d.value]));
  const anomalyMap = Object.fromEntries((anomaly || []).map((d) => [d.date, d.value]));
  const uncertaintyMap = Object.fromEntries((uncertainty || []).map((d) => [d.date, d.value]));

  const modelMaps = {};
  for (const [modelName, timeseries] of Object.entries(ensemble_models)) {
    modelMaps[modelName] = Object.fromEntries(timeseries.map((d) => [d.date, d.value]));
  }

  const result = base.map((d) => {
    const date = isDynamic ? time : d.date;
    const value = d.value;

    const ensembleVal = ensembleMap[d.date] ?? null;
    const uncertaintyVal = value != null && ensembleVal != null ? value : null;

    const row = {
      date,
      value,
      ensemble: ensembleVal,
      anomaly: anomalyMap[d.date] ?? null,
      uncertainty: uncertaintyMap[d.date] ?? null,
      uncertainty_min:
        ensembleVal != null && value != null ? ensembleVal - value : null,
      uncertainty_max:
        ensembleVal != null && value != null ? ensembleVal + value : null,
    };

    for (const [modelName, modelData] of Object.entries(modelMaps)) {
      row[modelName] = modelData[d.date] ?? null;
    }

    return row;
  });

  // Avoid sort if single result from dynamic season
  if (isDynamic || result.length === 1) {
    return result;
  }

  return result.sort((a, b) => parseISO(a.date) - parseISO(b.date));
};


