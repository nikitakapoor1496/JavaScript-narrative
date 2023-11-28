import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';

//schemas
import User from './Schema/User.js';

const server = express();
let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})

//return user record
const formatDatatoSend = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}

//create username dynamically
const generateUsername = async (email) => {
    let username = email.split("@")[0];
    let isNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result)
    isNotUnique ? username += nanoid().substring(0, 5) : "";
    return username;
}

server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;

    //validations user input
    if (fullname.length <= 3) {
        return res.status(403).json({ "error": "Full name must be atleast 4 characters" })
    }

    if (!email.length) {
        return res.status(403).json({ "error": "Email is mandatory" })
    }

    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Invalid email or format. Email should be in format abc@xyz.com" })
    }

    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be between 6-20 characters and must have at least one numeric and one uppercase." })
    }

    bcrypt.hash(password, 5, async (err, hashedPAssword) => {

        let username = await generateUsername(email);

        let user = new User({
            personal_info: {
                fullname: fullname,
                email,
                password: hashedPAssword,
                username
            }
        })

        user.save().then((usr) => {
            return res.status(200).json(formatDatatoSend(usr))
        }).catch(err => {
            if (err.code == 11000) {
                return res.status(500).json({ "error": "Email already exists" })
            }
            return res.status(500).json({ "error": err.message })
        })

        console.log(hashedPAssword)
    })

    // return res.status(200).json({ "status": "okay" })

})



// Sign in code

server.post("/signin", (req, res) => {
    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": "Email not found" })
            }

            bcrypt.compare(password, user.personal_info.password, (err, result) => {
                if (err) {
                    return res.status(403).json({ "error": "Error occurred while signing in, please try again." })
                }
                if (!result) {
                    return res.status(403).json({ "error": "Incorrect Password" })
                } else {
                    return res.status(200).json(formatDatatoSend(user))
                }
            })

            //return res.json({ "status": "got user document" })
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ "error": err.message })
        })
})
server.listen(PORT, () => {
    console.log('listening on port: ' + PORT)
})