const whitelistLinks = require('../config/allowedOrigins')

const credentials = (req, res, next) => {
    const origin = req.headers.origin;

    if(whitelistLinks.includes(origin)) {
        res.header('Access-Control-Allow-credentials', true)
    }
    next();
}

module.exports = credentials