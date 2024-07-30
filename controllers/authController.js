const fsPromises = require('fs').promises;
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const path = require('path')
const ms = require('ms');


const usersDB = {
    users: require('../models/users.json'),
    setUsers: function(data) { this.users = data}
}
const { 
    ACCESS_TOKEN_SECRET, 
    ACCESS_TOKEN_LIFE, 
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_LIFE, 
} = process.env;

const signinUser = async (req,res) => {

    // get form data
    const { email,pwd } = req.body

    // status 400 bad request
    if( !email || !pwd ) return res.status(400).json({ message: 'Username and password required!!'})

    try {
        const foundUser = usersDB.users.find( el => el.email === email)
        if(!foundUser) return res.status(401).json({ message: 'Email or Password invalid'})

        const pwdCheck = await bcrypt.compare(pwd, foundUser.pwd)
        if(!pwdCheck) return res.sendStatus(401)

        const accessToken = jwt.sign(
            { email: foundUser.email }, ACCESS_TOKEN_SECRET , { expiresIn: ACCESS_TOKEN_LIFE}
        )
        
        const refreshToken = jwt.sign(
            { email: foundUser.email }, REFRESH_TOKEN_SECRET ,{ expiresIn: REFRESH_TOKEN_LIFE}
        )
        const updatedUser = { 
            ...foundUser,
            token: refreshToken 
        }

        const otherUsers = usersDB.users.filter(el => el.email !== foundUser.email)
        usersDB.setUsers([...otherUsers, updatedUser]);

        await fsPromises.writeFile(
            path.join(__dirname,'..','models','users.json'),
            JSON.stringify(usersDB.users,4,"  ")
        )

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }) //sameSite: 'None' secure: true 
        return res.status(200).json({ message: 'SignIn successfull', user: { email: foundUser.email },roles: [2001,5150,1984], token: accessToken, expiresAt: new Date(Date.now() + ms(ACCESS_TOKEN_LIFE)) })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const signupUser = async (req,res) => {
    
    // get form data
    const { email,pwd } = req.body

    // Bad Request
    if( !email || !pwd ) return res.status(400).json({ message: 'email & password are required!!'})
    
    // Check for duplicate names
    const duplicate = usersDB.users.find( el => el.email === email)
  
    // Conflict username
    if(duplicate) return res.status(409).json({ message: `Email: ${email} already exist`})

    try {
        // hash pwd
        const hashPwd = await bcrypt.hash(pwd,10);
    
        // Store new user
        const newuser = { email, pwd:hashPwd }
        usersDB.setUsers([...usersDB.users, newuser]);

        await fsPromises.writeFile(
            path.join(__dirname,'..','models','users.json'),
            JSON.stringify(usersDB.users,4,"  ")
        )
        
        res.status(201).json({ message: `User ${email} signup successfull!`})
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const refreshToken = async (req,res) => {

    const cookies = req.cookies;
    
    // Bad Request
    if( !cookies?.jwt ) return res.sendStatus(403);
    const refreshToken = cookies.jwt;
    
    // Check user by token
    const foundUser = usersDB.users.find( el => el.token === refreshToken)
    
    // Conflict username
    if(!foundUser) return res.sendStatus(403)
    
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if(err || foundUser.email !== decoded.email ) return res.sendStatus(403) // invalid token
            const accessToken = jwt.sign(
                { email: decoded.email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '45s'}
            );
            res.json({ token: accessToken, expiresAt:  new Date(Date.now() + ms(ACCESS_TOKEN_LIFE)), user: { email: decoded.email } })
        }
    )
}

const logoutUser = async (req,res) => {

    const cookies = req.cookies;
    
    // Bad Request
    if( !cookies?.jwt ) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    // Check user by token in db
    const foundUser = usersDB.users.find( el => el.token === refreshToken)
    

    // Conflict username
    if(!foundUser) {
        
        res.clearCookie('jwt',{httpOnly: true }) //sameSite: 'None', secure: true
        return res.sendStatus(204)
    }

    const updatedUser = { 
        ...foundUser,
        token: ''
    }

    const otherUsers = usersDB.users.filter(el => el.token !== refreshToken)
    usersDB.setUsers([...otherUsers, updatedUser]);

    await fsPromises.writeFile(
        path.join(__dirname,'..','models','users.json'),
        JSON.stringify(usersDB.users,4,"  ")
    )
        
    res.clearCookie('jwt',{ httpOnly: true, secure: true })
    res.status(200).json({ msg: 'logout successful!'})
}

module.exports = { 
    signinUser,
    signupUser,
    logoutUser,
    refreshToken
}