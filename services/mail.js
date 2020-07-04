const mailer = require("nodemailer")

// create mailer object using the default SMTP transport
const mailService = mailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.SMTP_Port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_Username,
    pass: process.env.SMTP_Password,
  },
})

module.exports = { mailService }
