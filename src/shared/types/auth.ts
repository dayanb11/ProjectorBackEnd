export interface JWTPayload {
  user_id: number;
  employee_id: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    worker_id: number;
    employee_id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}