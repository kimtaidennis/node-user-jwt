const jwt = require('jsonwebtoken')
require('dotenv').config()

const usersDB = {
    users: require('../models/users.json'),
}

const verifyJWT = (req,res,next) => {

    const cookies = req.cookies;
    
    // Bad Request
    if( !cookies?.jwt ) return res.status(401).json({ message: 'cookies missing'}); // No content
    const refreshToken = cookies.jwt;
   
    const foundUser = usersDB.users.find( el => el.token === refreshToken)
    
    // Conflict username
    if(!foundUser) {
        res.clearCookie('jwt',{ httpOnly: true }) //sameSite: 'None', secure: true
        return res.res.status(401).json({ msg: 'missing founduser'})
    }
    
    const authHeader = req.headers['authorization']
    
    if(!authHeader) return res.status(401).json({ msg: 'missing Bearer'})
    console.log(authHeader.split(' ')[1]);
    const token = authHeader.split(' ')[1];
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) return res.res.status(403).json({ msg: 'Invalid token'}) // invalid token
            req.user = decoded.username
            next()
        }
    )
}

module.exports = verifyJWT