//import request from "@/utils/request";

//import { CMS_API } from "@/utils/apis";

//export const getApiDatasets = () =>
  //request.get("/datasets").then((res) => res?.data);

import { apiRequest } from "@/utils/request";

export const getApiDatasets = () =>
  apiRequest.get("/datasets").then((res) => res?.data);
