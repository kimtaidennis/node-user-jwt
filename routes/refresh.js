var express = require('express');
var router = express.Router();
const authController = require('../controllers/authController')

router.get('/',authController.refreshToken)

module.exports = router;