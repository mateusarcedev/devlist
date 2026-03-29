import axios, { type InternalAxiosRequestConfig } from 'axios'
import getClientSessionToken from './getClientSessionToken'

const baseURL = process.env.NEXT_PUBLIC_URL_API ?? process.env.URL_API

const AxiosConfig = axios.create({ baseURL })

AxiosConfig.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getClientSessionToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default AxiosConfig
