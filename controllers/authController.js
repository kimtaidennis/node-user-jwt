const fsPromises = require('fs').promises;
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const path = require('path')

const usersDB = {
    users: require('../models/users.json'),
    setUsers: function(data) { this.users = data}
}

const signinUser = async (req,res) => {

    // get form data
    const { user,pwd } = req.body

    // status 400 bad request
    if( !user || !pwd ) return res.status(400).json({ message: 'Username and password required!!'})

    try {
        const foundUser = usersDB.users.find( el => el.username === user)
        if(!foundUser) return res.sendStatus(401)

        const pwdCheck = await bcrypt.compare(pwd, foundUser.pwd)
        if(!pwdCheck) return res.sendStatus(401)

        const accessToken = jwt.sign(
            { username: foundUser.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '45s'}
        )
        
        const refreshToken = jwt.sign(
            { username: foundUser.username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d'}
        )
        const updatedUser = { 
            ...foundUser,
            token: refreshToken 
        }

        const otherUsers = usersDB.users.filter(el => el.username !== foundUser.username)
        usersDB.setUsers([...otherUsers, updatedUser]);

        await fsPromises.writeFile(
            path.join(__dirname,'..','models','users.json'),
            JSON.stringify(usersDB.users)
        )

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }) //sameSite: 'None' secure: true 
        return res.status(200).json({ message: 'SignIn successfull', username: foundUser.username, token: accessToken })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const signupUser = async (req,res) => {
    
    // get form data
    const { user,pwd } = req.body

    // Bad Request
    if( !user || !pwd ) return res.status(400).json({ message: 'User & Password are required!!'})
    
    // Check for duplicate names
    const duplicate = usersDB.users.find( el => el.username === user)
  
    // Conflict username
    if(duplicate) return res.status(409).json({ message: `Username: ${user} already exist`})

    try {
        // hash pwd
        const hashPwd = await bcrypt.hash(pwd,10);
    
        // Store new user
        const newuser = { username:user, pwd:hashPwd }
        usersDB.setUsers([...usersDB.users, newuser]);

        await fsPromises.writeFile(
            path.join(__dirname,'..','models','users.json'),
            JSON.stringify(usersDB.users)
        )
        
        res.status(201).json({ message: `User ${user} signup successfull!`})
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const refreshToken = async (req,res) => {

    const cookies = req.cookies;
    
    // Bad Request
    if( !cookies?.jwt ) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    
    // Check user by token
    const foundUser = usersDB.users.find( el => el.token === refreshToken)
    
    // Conflict username
    if(!foundUser) return res.sendStatus(403)
    
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if(err || foundUser.username !== decoded.username ) return res.sendStatus(403) // invalid token
            const accessToken = jwt.sign(
                { username: decoded.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '45s'}
            );
            res.json({ accessToken })
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
        JSON.stringify(usersDB.users)
    )
        
    res.clearCookie('jwt',{ httpOnly: true, secure: true })
    res.sendStatus(204)
}

module.exports = { 
    signinUser,
    signupUser,
    logoutUser,
    refreshToken
}