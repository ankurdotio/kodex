import axios from 'axios'

const REFRESH_URL = '/auth/refresh'

let refreshPromise = null
let accessToken = null

export const httpClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setAccessToken(token) {
  accessToken = token || null
  if (accessToken) {
    httpClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    return
  }

  delete httpClient.defaults.headers.common.Authorization
}

export function getAccessToken() {
  return accessToken
}

function queueRefresh() {
  if (!refreshPromise) {
    refreshPromise = httpClient
      .post(REFRESH_URL, {}, { skipAuthRefresh: true })
      .then((response) => {
        const token = response?.data?.accessToken || null
        setAccessToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

httpClient.interceptors.request.use((config) => {
  const nextConfig = { ...config }
  if (accessToken) {
    nextConfig.headers = nextConfig.headers || {}
    nextConfig.headers.Authorization = `Bearer ${accessToken}`
  }
  return nextConfig
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config
    const status = error?.response?.status

    if (!originalRequest) {
      return Promise.reject(error)
    }

    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error)
    }

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const token = await queueRefresh()
      if (!token) {
        return Promise.reject(error)
      }

      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${token}`
      return httpClient(originalRequest)
    } catch {
      setAccessToken(null)
      return Promise.reject(error)
    }
  },
)
