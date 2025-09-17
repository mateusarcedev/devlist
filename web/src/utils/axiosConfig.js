import axios from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_URL_API || process.env.URL_API || undefined

const AxiosConfig = axios.create({
  baseURL,
})

export default AxiosConfig
