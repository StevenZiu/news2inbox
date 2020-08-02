const http = require("axios")
const { HttpError } = require("http-errors")
const { newsApiEndpoint: API_ENDPOINT } = require("../config/api")

const getNewsByCountryAndCategory = (country, category) => {
  const API_KEY = process.env.NEWS_API_KEY || ""
  if (API_KEY === "") {
    console.error("api key missing")
    return {}
  }
  console.log(
    `${API_ENDPOINT}?apiKey=${API_KEY}&category=${category}&country=${country}`
  )
  return new Promise((resolve, reject) => {
    http({
      method: "get",
      url: `${API_ENDPOINT}?apiKey=${API_KEY}&category=${category}&country=${country}`,
    })
      .then((res) => {
        if (res.status === 200) {
          resolve({
            totalResults: res.data.totalResults,
            articles: res.data.articles,
          })
        } else {
          reject(res.message)
        }
      })
      .catch((err) => {
        reject(err.message)
      })
  })
}

module.exports = { getNewsByCountryAndCategory }
