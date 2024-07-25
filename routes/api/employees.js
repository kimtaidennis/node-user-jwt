var express = require('express');
var router = express.Router();
const employeeController = require('../../controllers/employeeController')
const verifyJWT = require('../../middleware/verifyJWT')

router.route('/').get(verifyJWT,employeeController.getAllEmployees).post(employeeController.addEmployee)

module.exports = router;
