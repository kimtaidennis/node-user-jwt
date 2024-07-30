var express = require('express');
var router = express.Router();
const customerController = require('../../controllers/customerController')
const verifyJWT = require('../../middleware/verifyJWT')

router.route('/').get(verifyJWT,customerController.getCustomers)

module.exports = router;
