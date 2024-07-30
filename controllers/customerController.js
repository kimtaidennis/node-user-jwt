const customersDB = {
    customers: require('../models/customers.json'),
    setCustomers: function(data) { this.customers = data}
}

const getCustomers = (req,res) => {
    return res.status(200).json({ customers: customersDB.customers })
}

module.exports = { getCustomers }