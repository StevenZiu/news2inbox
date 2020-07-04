const mysql = require("mysql")
const chalk = require("chalk")

const connectDB = (app) => {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
  })
  connection.connect((err) => {
    if (err) {
      console.log(chalk.red.inverse("DB Connect Failed: ", err.message))
      app.db = null
      return
    }
    console.log(chalk.cyan.inverse("DB Connect Success"))
    app.db = connection
  })
}

module.exports = {
  connectDB,
}
