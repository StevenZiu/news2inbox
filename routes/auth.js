const express = require("express")
const router = express.Router()
const sha256 = require("sha256")
const jwt = require("jsonwebtoken")
const chalk = require("chalk")
const { check, validationResult } = require("express-validator")
const fs = require("fs")
const handlebars = require("handlebars")
const path = require("path")

// register route
router.post(
  "/register",
  [
    check("email")
      .isEmail()
      .withMessage("Email is missing or not a valid email"),
    check("password")
      .isLength({ min: 5, max: 40 })
      .withMessage(
        "Password is required and length should be between 5 to 40 chars"
      ),
    check("username")
      .isLength({ min: 5, max: 20 })
      .withMessage(
        "Username is required and length should be between 5 to 20 chars "
      ),
  ],
  (req, res, next) => {
    // check if any errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // check if email hash already been taken
    const db = req.app.db
    const { email, password, username } = req.body
    const duplicateSql = `select * from users where user_email = ${db.escape(
      email
    )}`
    // execute duplicate check
    db.query(duplicateSql, (err, results, field) => {
      if (err) {
        res.status(500).json({ errors: "server Error" })
        console.log(chalk.red.inverse(err.sqlMessage))
        return
      }
      if (results.length !== 0) {
        res.status(400).json({ errors: "Email has already been taken." })
        return
      }
      // generate password hash
      const hashpassword = sha256(password).substr(0, 20)
      const registerSql = `insert into users (username, user_email, password) values (${db.escape(
        username
      )}, ${db.escape(email)}, ${db.escape(hashpassword)})`
      // execute register sql
      db.query(registerSql, (err, results, field) => {
        if (err) {
          res.status(500).json({ errors: "server Error" })
          console.log(err.sqlMessage)
          return
        }
        if (results.affectedRows === 1) {
          res.status(201).json({ message: "Register Success" })
        }
      })
    })
  }
)

// login route
router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Email is missing or not a valid email"),
    check("password").notEmpty().withMessage("Password is missing"),
  ],
  (req, res, next) => {
    // check if any errors from body data
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // prestore data
    const { email, password } = req.body
    const db = req.app.db
    // login sql
    const loginSql = `select * from Users where user_email=${db.escape(email)}`
    // execute login sql
    db.query(loginSql, (err, results, field) => {
      if (err) {
        res.status(500).json({ errors: "Server Error" })
        console.log(chalk.red.inverse(err.sqlMessage))
        return
      }
      if (
        results.length !== 0 &&
        results[0].password === sha256(password).substr(0, 20)
      ) {
        // login success, generate the jwt
        // attach the user information in the jwt
        const userInfoInJwt = {
          username: results[0].username,
          uid: results[0].uid,
          userEmail: results[0].user_email,
        }
        const secret = process.env.JWT_SECRET
        // check secret existing
        if (!secret) {
          res.status(500).json({ errors: "Server Error" })
          console.log(chalk.red.inverse("JWT secret missing"))
          return
        }
        // TODO: one user can only have one jwt in an hour
        // maybe need to setup a table for storing jwt token
        jwt.sign(
          userInfoInJwt,
          secret,
          { expiresIn: "1h", algorithm: "HS256" },
          (err, token) => {
            if (err) {
              res.status(500).json({ errors: "Server Error" })
              console.log(chalk.red.inverse(err))
              return
            }
            res.status(200).json({ token })
            return
          }
        )
      } else {
        res
          .status(400)
          .json({ errors: "Email or passowrd does not match or not exist" })
      }
    })
  }
)

// forgot password route
router.post(
  "/forgot-password",
  [
    check("email")
      .isEmail()
      .withMessage("Email is missing or not a valid email"),
  ],
  (req, res, next) => {
    // check if any errors from body data
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { email } = req.body
    const { db, mailer } = req.app
    const checkUserExistSql = `select * from Users where user_email = ${db.escape(
      email
    )}`
    db.query(checkUserExistSql, (err, result, field) => {
      if (err) {
        res.status(500).json({ errors: "Server Error" })
        console.log(err.sqlMessage)
        return
      }
      if (result.length !== 0) {
        const passwordAsJWTSecret = result[0].password
        jwt.sign(
          { email },
          passwordAsJWTSecret,
          // token expires in 1 hour
          { expiresIn: "1h", algorithm: "HS256" },
          async (err, token) => {
            if (err) {
              res.status(500).json({ errors: "Server Error" })
              console.log(`Generate reset jwt token failed: ${err}`)
              return
            }
            // send the reset the password email
            // load email template
            const mailTemplate = fs
              .readFileSync(
                path.join(__dirname, "../assets/reset-password.html"),
                "utf-8"
              )
              .toString()
            const compiledTemplate = handlebars.compile(mailTemplate)
            // interpolate token to template
            // TODO: pass E2/E3 link here
            const withTokenTemplate = compiledTemplate({
              resetLink: `https://google.com?token=${token}`,
            })
            let mailInfo
            try {
              mailInfo = await mailer.sendMail({
                from: '"News2Inbox👻" <news2inboxcs@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Reset Password for News2Inbox", // Subject line
                html: withTokenTemplate,
              })
            } catch (err) {
              console.log(chalk.red.inverse(`mail sent fail: ${err}`))
            }

            if (mailInfo.messageId) {
              console.log(
                chalk.green.inverse(
                  `reset mail sent: ${mailInfo.messageId}, for user: ${email}`
                )
              )
            } else {
              console.log(`mail sent fail for user: ${email}`)
            }
          }
        )
      } else {
        // log to tell backend, someone is trying to reset the password for non-existing users
        console.log(
          chalk.red(
            `Warning: someone is trying to reset the password for non-existing user: ${email}`
          )
        )
      }
      // return 200 anyway for client side
      res
        .status(200)
        .json(
          "If your email exists in our database, we will send an reset password email to that."
        )
    })
  }
)

// check reset password token
router.post(
  "/reset-password-token-check",
  [check("token").notEmpty().withMessage("reset token is missing")],
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { db } = req.app
    const { token } = req.body
    const decodedToken = jwt.decode(token)
    if (decodedToken === null) {
      res.status(400).json({ errors: "token format incorrect" })
      return
    }
    const { email } = decodedToken
    const getUserOldPassword = `select * from Users where user_email = ${db.escape(
      email
    )}`
    db.query(getUserOldPassword, (err, result) => {
      if (err) {
        res.status(500).json({ errors: "Server Error" })
        console.log(chalk.red.inverse(err.sqlMessage))
        return
      }
      if (result.length !== 0) {
        const { password } = result[0]
        jwt.verify(token, password, (err, decoded) => {
          if (err) {
            console.log(chalk.red.inverse(err))
            res.status(400).json(`Token verified failed: ${err}`)
            return
          }
          res.status(200).json(`Token verifed success: ${decoded.email}`)
        })
      } else {
        res.status(400).json("Token Verified Failed")
      }
    })
  }
)

// set new password
router.post(
  "/new-password",
  [
    check("token").notEmpty().withMessage("token is missing"),
    check("password")
      .isLength({ min: 5, max: 40 })
      .withMessage(
        "New password is required and length should be between 5 to 40 chars"
      ),
  ],
  (req, res, next) => {
    // check if any errors from body data
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // deconstruct data
    const { mailer, db } = req.app
    const { token, password } = req.body
    // decode token to get email

    const decodedToken = jwt.decode(token)
    if (decodedToken === null) {
      res.status(400).json({ errors: "token format incorrect" })
      return
    }
    // get old password as secret
    const { email = null } = decodedToken
    const getUserOldPassword = `select * from Users where user_email = ${db.escape(
      email
    )}`
    db.query(getUserOldPassword, (err, result) => {
      if (err) {
        res.status(500).json({ errors: "Server Error" })
        console.log(chalk.red.inverse(err.sqlMessage))
        return
      }
      if (result.length !== 0) {
        const { password } = result[0]
        jwt.verify(token, password, (err, decoded) => {
          if (err) {
            console.log(chalk.red.inverse(err))
            res.status(400).json({ errors: `token validation failed: ${err}` })
            return
          }
          const newPassword = sha256(password).substr(0, 20)
          const changePassword = `update Users set password = ${db.escape(
            newPassword
          )} where user_email = ${db.escape(email)}`
          db.query(changePassword, (err, result) => {
            if (err) {
              console.log(chalk.red.inverse(err.sqlMessage))
              res.status(500).json({ errors: "Server Error" })
              return
            }
            if (result.affectedRows === 1) {
              res.status(201).json({ message: "New password updated" })
            }
          })
        })
      } else {
        console.log(
          chalk.red.inverse(
            `someone is trying to set new password for non exising user email ${email}`
          )
        )
        res.status(400).json({ errors: `token validation failed: ${err}` })
      }
    })
  }
)

module.exports = router
