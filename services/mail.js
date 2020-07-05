const mailer = require("nodemailer")
const chalk = require("chalk")

// create mailer object using the default SMTP transport
const mailService = async (app) => {
  const mail = await mailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.SMTP_Port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_Username,
      pass: process.env.SMTP_Password,
    },
  })
  mail.verify((err, success) => {
    if (err) {
      console.log(chalk.red.inverse("Connect mail server failed"), err.message)
      app.mailer = null
    } else if (success) {
      console.log(chalk.cyan.inverse("Connect mail server success"))
      app.mailer = mail
    }
  })
}

module.exports = { mailService }
