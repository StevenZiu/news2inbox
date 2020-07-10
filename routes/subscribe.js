const express = require("express")
const router = express.Router()
const chalk = require("chalk")
const { check, validationResult, body } = require("express-validator")
const { supportedCountries, supportedCategories } = require("../config/const")

// create/update new subscribe
// for current beta version, each user can only subscribe to one country with 2 categories
// @inbody country in string, categaries in "business+entertainment"
// category is optional
router.post(
  "/",
  [
    check("country")
      .isIn(supportedCountries)
      .withMessage("selected country is not supported"),
  ],
  (req, res, next) => {
    // check if any errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { username, uid } = req.userInfo
    const { country, categories = null } = req.body
    // check categories
    if (categories !== null) {
      let temp = categories.split("+")
      if (!temp.every((category) => supportedCategories.includes(category))) {
        res.status(400).json({
          errors: "Selected categories are not supported",
        })
        return
      }
    }
    const db = req.app.db
    const newSubscribeSql = `insert into subscribe (uid, countries, categories) values (${uid}, ${db.escape(
      country
    )}, ${db.escape(
      categories
    )}) on duplicate key update uid=${uid}, countries=${db.escape(
      country
    )}, categories=${db.escape(categories)}`
    db.query(newSubscribeSql, (err, results, field) => {
      if (err) {
        res.status(500).json({ errors: "server Error" })
        console.log(chalk.red.inverse(err.sqlMessage))
        return
      }
      res.status(201).json({
        message: "subscribed",
      })
    })
  }
)

// get subscribe
router.get("/", (req, res, next) => {
  const { uid } = req.userInfo
  const db = req.app.db
  const getSubscribeSql = `select * from subscribe where uid=${uid}`
  db.query(getSubscribeSql, (err, results, field) => {
    if (err) {
      res.status(500).json({ errors: "server Error" })
      console.log(chalk.red.inverse(err.sqlMessage))
      return
    }
    if (results.length > 0) {
      res.status(200).json(results[0])
    } else {
      res.status(200).json([])
    }
  })
})

// remove subscribe
router.delete(
  "/",
  [check("recordId").notEmpty().withMessage("subscribe record id is missing")],
  (req, res, next) => {
    // check if any errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const db = req.app.db
    const { uid } = req.userInfo
    const { recordId } = req.body
    const deleteSubcribeSql = `delete from subscribe where uid = ${uid} and record_id = ${db.escape(
      recordId
    )}`
    db.query(deleteSubcribeSql, (err, results, field) => {
      if (err) {
        res.status(500).json({ errors: "server Error" })
        console.log(chalk.red.inverse(err.sqlMessage))
        return
      } else if (results.affectedRows === 1) {
        res.status(201).json({
          message: "deleted",
        })
      } else {
        res.status(400).json({
          errors:
            "you don't have permission to delete the record or record does not exist",
        })
      }
    })
  }
)
module.exports = router
