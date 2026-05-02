import { BACKEND_URL } from "@/const";
import axiosApi from "axios";

export const axios = axiosApi.create({
  baseURL: BACKEND_URL + "/api",
  withCredentials: true,
});
