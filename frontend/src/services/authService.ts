import { http } from "@/lib/api/client";
import type {
  LoginResponse,
  MeResponse,
  MessageResponse,
  SignupResponse,
  User,
} from "@/types/api";

export interface SignupRequest {
  login_id: string;
  email: string;
  password: string;
  confirm_password: string;
}
export interface LoginRequest {
  login_id: string;
  password: string;
}

/** PART B1 — Auth endpoints. */
export const authService = {
  /** POST /auth/signup → 201 flat user. No cookie set. */
  signup: (body: SignupRequest) => http.post<SignupResponse>("/auth/signup", body),

  /** POST /auth/login → 200 { user } (A8, nested). Cookie set by backend. */
  login: async (body: LoginRequest): Promise<User> => {
    const data = await http.post<LoginResponse>("/auth/login", body);
    return data.user;
  },

  /** POST /auth/logout → 200 { message }. Clears the auth cookie. */
  logout: () => http.post<MessageResponse>("/auth/logout"),

  /** GET /auth/me → 200 flat user (A9). */
  me: () => http.get<MeResponse>("/auth/me"),

  /** POST /auth/forgot-password → 200 { message }. */
  forgotPassword: (email: string) =>
    http.post<MessageResponse>("/auth/forgot-password", { email }),
};
