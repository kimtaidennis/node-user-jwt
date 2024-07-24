var express = require('express');
var router = express.Router();
const authController = require('../controllers/authController')

router.post('/',authController.signupUser)

module.exports = router;
