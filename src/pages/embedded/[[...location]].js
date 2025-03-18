import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import useRouter from "@/utils/router";
import { decodeQueryParams } from "@/utils/url";

import Map from "@/layouts/map";
import MapUrlProvider from "@/providers/map-url-provider";
import LocationProvider from "@/providers/location-provider";

import { setMapSettings } from "@/components/map/actions";
import { setMainMapSettings } from "@/layouts/map/actions";
import { setMenuSettings } from "@/components/map-menu/actions";
import { setAnalysisSettings } from "@/components/analysis/actions";
import { setModalMetaSettings } from "@/components/modals/meta/actions";

import "./styles.scss"; // Custom styles for iframe

const ALLOWED_TYPES = ["country", "use", "geostore", "aoi", "point"];

export const getServerSideProps = async ({ params }) => {
  const [type] = params?.location || [];

  if (type && !ALLOWED_TYPES.includes(type)) {
    return {
      props: { error: 404, title: "Location Not Found" },
    };
  }

  return {
    props: {
      title: "Embedded Map",
      description: "A simplified embedded map view.",
    },
  };
};

const EmbeddedMapPage = (props) => {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const { query, asPath } = useRouter();

  useEffect(() => {
    const { map, mainMap, mapMenu, analysis, modalMeta } =
      decodeQueryParams(query) || {};

    if (map) {
      dispatch(setMapSettings(map));
    }

    if (mainMap) {
      dispatch(setMainMapSettings(mainMap));
    }

    if (mapMenu) {
      dispatch(setMenuSettings(mapMenu)); // ✅ Sidebar menu still included
    }

    if (analysis) {
      dispatch(setAnalysisSettings(analysis)); // ✅ Analysis settings included
    }

    if (modalMeta) {
      dispatch(setModalMetaSettings(modalMeta)); // ✅ Metadata modal included
    }
  }, [asPath]);

  useEffect(() => {
    if (!ready) {
      setReady(true);
    }
  });

  const handleOnLocationReady = () => {
    setLocationReady(true);
  };

  return (
    <div className="embedded-map-container">
      {ready && (
        <>
          <LocationProvider onReady={handleOnLocationReady} />
          <MapUrlProvider />
          {locationReady && <Map />}
        </>
      )}
    </div>
  );
};

export default EmbeddedMapPage;
