const getApiBaseUrl = () => {
  return process.env.URL_API || process.env.NEXT_PUBLIC_URL_API || ''
}

export default getApiBaseUrl
