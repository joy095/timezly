import { api } from "@/axios";
import {
  ForgotPasswordData,
  LoginData,
  LoginError,
  ResetPasswordOtpData,
  SignUpData,
} from "@/interface";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { saveToken } from "../lib/secureStore";
import { VerifyEmailOtpInput } from "@/schemas/auth.schema";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginData) => {
      try {
        const res = await api.post("/auth/sign-in/email", data);
        const token = res.data.token;

        if (!token) {
          throw { message: "No token received", code: "MISSING_TOKEN" };
        }

        // Save token securely
        await saveToken(token);

        return res.data;
      } catch (err: unknown) {
        let error: LoginError = {
          message: "Something went wrong",
          code: "UNKNOWN_ERROR",
        };

        // Axios error
        if ((err as AxiosError)?.response) {
          const axiosErr = err as AxiosError;
          const data = axiosErr.response?.data as any;

          error = {
            message: data?.message ?? "Something went wrong",
            code: data?.code ?? "UNKNOWN_ERROR",
          };
        }

        // Throw structured error for React Query
        throw error;
      }
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: async (data: SignUpData) => {
      try {
        const res = await api.post("/auth/sign-up/email", data);

        return res.data;
      } catch (err: unknown) {
        let error: LoginError = {
          message: "Something went wrong",
          code: "UNKNOWN_ERROR",
        };

        if ((err as AxiosError)?.response) {
          const axiosErr = err as AxiosError;
          const data = axiosErr.response?.data as any;

          error = {
            message: data?.message,
            code: data?.code,
          };
        }

        // Throw structured error for React Query
        throw error;
      }
    },
  });
};

export const useVerifyEmailOtp = () => {
  return useMutation({
    mutationFn: async (data: VerifyEmailOtpInput) => {
      try {
        const res = await api.post("/auth/email-otp/verify-email", data);

        const token = res.data.token;

        if (!token) {
          throw { message: "No token received", code: "MISSING_TOKEN" };
        }

        // Save token securely
        await saveToken(token);

        return res.data;
      } catch (err: unknown) {
        let error: LoginError = {
          message: "Something went wrong",
          code: "UNKNOWN_ERROR",
        };

        if ((err as AxiosError)?.response) {
          const axiosErr = err as AxiosError;
          const data = axiosErr.response?.data as any;

          error = {
            message: data?.message,
            code: data?.code,
          };
        }

        // Throw structured error for React Query
        throw error;
      }
    },
  });
};

export const useForgetPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      try {
        const res = await api.post(
          "/auth/email-otp/request-password-reset",
          data,
        );

        return res.data;
      } catch (err: unknown) {
        let error: LoginError = {
          message: "Something went wrong",
          code: "UNKNOWN_ERROR",
        };

        // Axios error
        if ((err as AxiosError)?.response) {
          const axiosErr = err as AxiosError;
          const data = axiosErr.response?.data as any;

          error = {
            message: data?.message,
            code: data?.code,
          };
        }

        // Throw structured error for React Query
        throw error;
      }
    },
  });
};

export const useResetPasswordOtp = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordOtpData) => {
      try {
        const res = await api.post("/auth/email-otp/reset-password", data);

        return res.data;
      } catch (err: unknown) {
        let error: LoginError = {
          message: "Something went wrong",
          code: "UNKNOWN_ERROR",
        };

        // Axios error
        if ((err as AxiosError)?.response) {
          const axiosErr = err as AxiosError;
          const data = axiosErr.response?.data as any;

          error = {
            message: data?.message,
            code: data?.code,
          };
        }

        // Throw structured error for React Query
        throw error;
      }
    },
  });
};
