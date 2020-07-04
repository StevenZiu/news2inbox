const express = require('express')
const router = express.Router()

router.get('/health', (req, res, next) => {
  res.status(200).send({message: 'api is up'})
})

module.exports = router