export interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginError {
  message: string;
  code: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordOtpData {
  email: string;
  password: string;
  otp: string;
}