var express = require('express');
var router = express.Router();
const authController = require('../controllers/authController')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/').get(authController.logoutUser)

module.exports = router;
