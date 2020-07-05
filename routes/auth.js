const express = require("express")
const router = express.Router()
const sha256 = require("sha256")
const jwt = require("jsonwebtoken")
const chalk = require("chalk")
const { check, validationResult } = require("express-validator")
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
    const duplicateSql = `select * from users where user_email = ${db.escape(
      req.body.email
    )}`

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
      const hashpassword = sha256(req.body.password).substr(0, 20)
      const registerSql = `insert into users (username, user_email, password) values (${db.escape(
        req.body.username
      )}, ${db.escape(req.body.email)}, ${db.escape(hashpassword)})`

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
// router.post("/login", (req, res, next) => {
//   const { email = null, password = null } = req.body
//   if (email === null || password === null) {
//     res.status(400).send("Login information missing.")
//     return
//   }
//   const cleanEmail = req.sanitize(email)
//   const cleanPassword = req.sanitize(password)
//   const loginSql = `select * from Users where email_address='${cleanEmail}'`
//   const db = req.app.db
//   db.query(loginSql, (err, results, field) => {
//     if (err) {
//       res.status(500).send("Server Error")
//       console.log(err.sqlMessage)
//       return
//     }
//     if (
//       results.length !== 0 &&
//       results[0].login_password === sha256(cleanPassword).substr(0, 20)
//     ) {
//       // login success, generate the jwt
//       // attach the user information in the jwt
//       const userInfoInJwt = {
//         user_id: results[0].user_id,
//         user_email: results[0].email_address,
//       }
//       const secret = process.env.JWT_SECRET
//       if (!secret) {
//         res.status(500).send("Server Error")
//         console.log("JWT secret missing")
//         return
//       }
//       // TODO: one user can only have one jwt in an hour
//       jwt.sign(
//         userInfoInJwt,
//         secret,
//         { expiresIn: "1h", algorithm: "HS256" },
//         (err, token) => {
//           if (err) {
//             res.status(500).send("Server Error")
//             console.log(err)
//             return
//           }
//           res.status(200).send(token)
//           return
//         }
//       )
//     } else {
//       res.status(400).send("Email or passowrd does not match.")
//     }
//   })
// })

// // forgot password route
// router.post("/forgot-password", (req, res, next) => {
//   const { email = null } = req.body
//   const cleanEmail = req.sanitize(email)
//   if (cleanEmail === null || cleanEmail === "") {
//     res.status(400).send("Email is missing")
//     return
//   }
//   const checkUserExistSql = `select * from Users where email_address = '${cleanEmail}'`
//   const db = req.app.db
//   db.query(checkUserExistSql, (err, result, field) => {
//     if (err) {
//       res.status(500).send("Server Error")
//       console.log(err.sqlMessage)
//       return
//     }
//     if (result.length !== 0) {
//       const passwordAsJWTSecret = result[0].login_password
//       jwt.sign(
//         { email: cleanEmail },
//         passwordAsJWTSecret,
//         // token expires in 10 mins
//         { expiresIn: "1h", algorithm: "HS256" },
//         async (err, token) => {
//           if (err) {
//             res.status(500).send("Server Error")
//             console.log(`Generate reset jwt token failed: ${err}`)
//             return
//           }
//           // send the reset the password email
//           let mailInfo
//           try {
//             mailInfo = await mailer.sendMail({
//               from: '"Tomato Notes Team👻" <tomatonotes1@gmail.com>', // sender address
//               to: cleanEmail, // list of receivers
//               subject: "Reset Password for Tomato Notes", // Subject line
//               html: `
//                 <p>Please click the following link to reset your password for Tomato Notes: </p>
//                 <br/>
//                 <p>https://google.com?token=${token}</p>
//                 <br/>
//                 <p>The link will expire in 10 minutes, and you can only use this link to reset your password one time.</p>
//                 <br/>
//                 <p>Tomato Notes Team</p>
//               `,
//             })
//           } catch (err) {
//             console.log(`mail sent fail: ${err}`)
//           }

//           if (mailInfo.messageId) {
//             console.log(
//               `reset mail sent: ${mailInfo.messageId}, for user: ${cleanEmail}`
//             )
//           } else {
//             console.log(`mail sent fail for user: ${cleanEmail}`)
//           }
//         }
//       )
//     } else {
//       // log to tell backend, someone is trying to reset the password for non-existing users
//       console.log(
//         chalk.red(
//           `Warning: someone is trying to reset the password for non-existing user: ${cleanEmail}`
//         )
//       )
//     }
//     // return 200 anyway for client side
//     res
//       .status(200)
//       .send(
//         "If your email exists in our database, we will send an reset password email to that."
//       )
//   })
// })

// // check reset password token
// router.get("/reset-password", (req, res, next) => {
//   const token = req.query.token
//   if (token === undefined || token === "") {
//     res.status(400).send("reset token missing")
//   }
//   const decodedToken = jwt.decode(token)
//   const { email } = decodedToken
//   const db = req.app.db
//   const getUserOldPassword = `select * from Users where email_address = '${email}'`
//   db.query(getUserOldPassword, (err, result) => {
//     if (err) {
//       res.status(500).send("Server Error")
//       console.log(err.sqlMessage)
//       return
//     }
//     if (result.length !== 0) {
//       const { login_password } = result[0]
//       jwt.verify(token, login_password, (err, decoded) => {
//         if (err) {
//           console.log(err)
//           res.status(400).send(`Token verified failed: ${err}`)
//           return
//         }
//         res.status(200).send(`Token verifed success: ${decoded.email}`)
//       })
//     } else {
//       res.status(400).send("Token Verified Failed")
//     }
//   })
// })

// // set new password
// router.post("/new-password", (req, res, next) => {
//   // token for reset password
//   let { token, password } = req.body
//   token = req.sanitize(token)
//   password = req.sanitize(password)
//   if (token === undefined || token === "") {
//     res.status(400).send("reset token missing")
//   }
//   const decodedToken = jwt.decode(token)
//   const { email } = decodedToken
//   const db = req.app.db
//   const getUserOldPassword = `select * from Users where email_address = '${email}'`
//   db.query(getUserOldPassword, (err, result) => {
//     if (err) {
//       res.status(500).send("Server Error")
//       console.log(err.sqlMessage)
//       return
//     }
//     if (result.length !== 0) {
//       const { login_password } = result[0]
//       jwt.verify(token, login_password, (err, decoded) => {
//         if (err) {
//           console.log(err)
//           res.status(400).send(`Token verified failed: ${err}`)
//           return
//         }
//         const newPassword = sha256(password).substr(0, 20)
//         const changePassword = `update Users set login_password = '${newPassword}' where email_address = '${email}'`
//         db.query(changePassword, (err, result) => {
//           if (err) {
//             console.log(err.sqlMessage)
//             res.status(500).send("Server Error")
//             return
//           }
//           if (result.affectedRows === 1) {
//             res.status(201).send("New password updated")
//           }
//         })
//       })
//     } else {
//       res.status(400).send("Token Verified Failed")
//     }
//   })
// })

module.exports = router
