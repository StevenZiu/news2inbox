const express = require("express")
const router = express.Router()

const authRouter = require("./auth")

router.get("/health", (req, res, next) => {
  res.status(200).send({ message: "api is up" })
})

router.use("/auth", authRouter)

module.exports = router
