import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

const baseURL = process.env.NEXT_PUBLIC_URL_API ?? process.env.URL_API

const AxiosConfig: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
})

// Refresh queue: prevents multiple concurrent 401s from triggering parallel refresh calls
let isRefreshing = false
let refreshQueue: Array<(ok: boolean) => void> = []

function notifyQueue(ok: boolean) {
  refreshQueue.forEach(cb => cb(ok))
  refreshQueue = []
}

AxiosConfig.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Don't retry the refresh or me endpoints (avoid infinite loop)
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/me')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push(ok => {
          if (ok) {
            originalRequest._retry = true
            resolve(AxiosConfig(originalRequest))
          } else {
            reject(error)
          }
        })
      })
    }

    isRefreshing = true
    originalRequest._retry = true

    try {
      await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      notifyQueue(true)
      return AxiosConfig(originalRequest)
    } catch {
      notifyQueue(false)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default AxiosConfig
