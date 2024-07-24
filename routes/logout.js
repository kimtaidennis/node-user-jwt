var express = require('express');
var router = express.Router();
const authController = require('../controllers/authController')

router.get('/',authController.logoutUser)

module.exports = router;
