const jwt = require('jsonwebtoken')
require('dotenv').config()

const usersDB = {
    users: require('../models/users.json'),
}

const verifyJWT = (req,res,next) => {

    const cookies = req.cookies;
    
    // Bad Request
    if( !cookies?.jwt ) return res.sendStatus(401); // No content
    const refreshToken = cookies.jwt;

    const foundUser = usersDB.users.find( el => el.token === refreshToken)
    
    // Conflict username
    if(!foundUser) {
        res.clearCookie('jwt',{ httpOnly: true }) //sameSite: 'None', secure: true
        return res.sendStatus(401)
    }

    const authHeader = req.headers['authorization']
    if(!authHeader) return res.sendStatus(401)
    
    const token = authHeader.split(' ')[1];
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) return res.sendStatus(403) // invalid token
            req.user = decoded.username
            next()
        }
    )
}

module.exports = verifyJWT