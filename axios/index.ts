import { BACKEND_URL } from "@/const";
import axios from "axios";

export const api = axios.create({
  baseURL: BACKEND_URL + "/api",
  withCredentials: true,
});


// api.interceptors.request.use(async (config) => {
//   const token = await getToken();

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });
