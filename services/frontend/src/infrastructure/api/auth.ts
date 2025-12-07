import { apiClient } from './client'
import { AuthUser } from '../../domain/entities/user'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: AuthUser // Use AuthUser for consistency
}

export interface RegisterResponse {
  user: AuthUser
}

export const authAPI = {
  login: async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      return response
    } catch (error) {
      throw error
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register', data)
      return response
    } catch (error) {
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },

  getCurrentUser: async (): Promise<AuthUser> => { // Explicitly type return
    const { data } = await apiClient.get<AuthUser>('/auth/me')
    return data
  },
}
