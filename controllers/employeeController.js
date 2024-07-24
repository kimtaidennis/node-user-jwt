const employeeDB = {
    employees: require('../models/employees.json'),
    setEmployee: function(data) { this.employees = data}
}

const getAllEmployees = (req,res) => {
    return res.status(200).json({ data: employeeDB.employees})
}

module.exports = { 
    getAllEmployees
}