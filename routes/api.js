const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const authRouter = require("./auth")
const subscribeRouter = require("./subscribe")
const chalk = require("chalk")
router.get("/health", (req, res, next) => {
  res.status(200).send({ message: "api is up" })
})

router.use("/auth", authRouter)

// check jwt for all the request, block unauthorized request
router.use((req, res, next) => {
  if (!req.token) {
    res.status(403).json({
      message: "Unauthorized request",
    })
  } else {
    const token = req.token
    const secret = process.env.JWT_SECRET
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log(chalk.red.inverse(err))
        res.status(403).json(`Unauthorized request`)
        return
      }
      req.userInfo = {
        username: decoded.username,
        uid: decoded.uid,
        userEmail: decoded.userEmail,
      }
      next()
    })
  }
})

router.use("/subscribe", subscribeRouter)

module.exports = router
