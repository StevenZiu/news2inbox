var express = require('express');
var router = express.Router();
const apiRouter = require('./api')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/api/v1', apiRouter)

module.exports = router;
