import axios from 'axios'
import getClientSessionToken from './getClientSessionToken'

const baseURL =
  process.env.NEXT_PUBLIC_URL_API || process.env.URL_API || undefined

const AxiosConfig = axios.create({
  baseURL,
})

AxiosConfig.interceptors.request.use(config => {
  const token = getClientSessionToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default AxiosConfig
