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
}) => {
  const params = {
    geostore_id: geostoreId,
    time_from: startTime,
    value_type: valueType,
  };

  const response = await request.get(
    `${CMS_API}/raster-data/geostore/timeseries/${layerId}`,
    { params }
  );

  // console.log("Received timeseries response:", response.data);

  const {
    base = [],
    ensemble = [],
    anomaly = [],
    uncertainty = [],
  } = response.data || {};

  const ensembleMap = Object.fromEntries(ensemble.map((d) => [d.date, d.value]));
  const anomalyMap = Object.fromEntries(anomaly.map((d) => [d.date, d.value]));
  const uncertaintyMap = Object.fromEntries(uncertainty.map((d) => [d.date, d.value]));

  const result = base.map((d) => {
    const eVal = ensembleMap[d.date];
    const aVal = anomalyMap[d.date];
    const uVal = uncertaintyMap[d.date];

    return {
      date: d.date,
      value: d.value,           // main/base value
      ensemble: eVal ?? null,
      anomaly: aVal ?? null,
      uncertainty: uVal ?? null,
      uncertainty_min: eVal != null && uVal != null ? eVal - uVal : null,
      uncertainty_max: eVal != null && uVal != null ? eVal + uVal : null,
    };
  });

  return result.sort((a, b) => parseISO(a.date) - parseISO(b.date));
};

