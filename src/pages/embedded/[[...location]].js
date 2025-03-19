import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import cx from "classnames";

import useRouter from "@/utils/router";
import { decodeQueryParams } from "@/utils/url";

import Map from "@/layouts/map";
import MapUrlProvider from "@/providers/map-url-provider";
import LocationProvider from "@/providers/location-provider";
//import EmbeddedFullscreenWrapper from "@/wrappers/embendfullscreen";

import { setMapSettings } from "@/components/map/actions";
import { setMainMapSettings } from "@/layouts/map/actions";
import { setMenuSettings } from "@/components/map-menu/actions";
import { setAnalysisSettings } from "@/components/analysis/actions";
import { setModalMetaSettings } from "@/components/modals/meta/actions";

import "./styles.scss"; // Custom styles for iframe

const notFoundProps = {
  error: 404,
  title: "Location Not Found",
  errorTitle: "Location Not Found",
};

const ALLOWED_TYPES = ["country", "use", "geostore", "aoi", "point"];

export const getServerSideProps = async ({ req, params }) => {
  const [type] = params?.location || [];

  if (type && !ALLOWED_TYPES.includes(type)) {
    return {
      props: notFoundProps,
    };
  }

  if (!type) {
    return {
      props: {
        title: "MapViewer",
        description: "MapViewer",
      },
    };
  }

  if (type === "country") {
    return {
      props: {
        title: "MapViewer For Country",
      },
    };
  }

  if (type === "aoi") {
    return {
      props: {
        title: "MapViewer for Area of Interest",
      },
    };
  }

  if (type === "point") {
    return {
      props: {
        title: "MapViewer for custom point",
      },
    };
  }

  if (type === "geostore") {
    return {
      props: {
        title: "MapViewer for custom area",
      },
    };
  }

  try {
    const title = "MapViewer";

    const description = "MapViewer";
    const noIndex = !["country"].includes(type);

    return {
      props: {
        title,
        description,
        noIndex,
      },
    };
  } catch (err) {
    return {
      props: notFoundProps,
    };
  }
};
const EmbeddedMapPage = (props) => {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const { query, asPath, isFallback } = useRouter();
  const fullPathname = asPath?.split("?")?.[0];

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
      dispatch(setMenuSettings(mapMenu));
    }

    if (analysis) {
      dispatch(setAnalysisSettings(analysis));
    }

    if (modalMeta) {
      dispatch(setModalMetaSettings(modalMeta));
    }
  }, [fullPathname, isFallback]);

  // when setting the query params from the URL we need to make sure we don't render the map
  // on the server otherwise the DOM will be out of sync
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
      <div className={cx("content-wrapper")}>
        {ready && (
          <>
            <LocationProvider onReady={handleOnLocationReady} />
            <MapUrlProvider />
            {locationReady && <Map />}
          </>
        )}
      </div>
    </div>
  );
};

export default EmbeddedMapPage;
