const fsPromises = require('fs').promises;
const path = require('path')

const employeeDB = {
    employees: require('../models/employees.json'),
    setEmployee: function(data) { this.employees = data}
}

const getAllEmployees = (req,res) => {
    return res.status(200).json({ data: employeeDB.employees})
}

const addEmployee = async (req,res) => {

    // get form data
    const { firstname,lastname } = req.body

    // status 400 bad request
    if( !firstname || !lastname ) return res.status(400).json({ message: 'firstname and lastname required!!'});

    try {
        const newEmployee = {
            id: (employeeDB.employees.length + 1),
            firstname,
            lastname
        }
        const allEmployees = employeeDB.setEmployee([...employeeDB.employees,newEmployee])
        await fsPromises.writeFile(
            path.join(__dirname,'..','models','employees.json'),
            JSON.stringify(employeeDB.employees,null,true)
        )

        res.status(201).json({ message: `Employee ${firstname} added successfull!`})
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

module.exports = { 
    getAllEmployees,
    addEmployee
}