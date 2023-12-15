import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import aws from 'aws-sdk';  /* To connect with the aws using aws-sdk */

//schemas
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';

const server = express();
let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

// mongoose.connect(process.env.DB_LOCATION, {
//     autoIndex: true
// })

const connectDB = async () => {
    await mongoose.connect(process.env.DB_LOCATION, { autoIndex: true })
        .catch(function (error) {
            console.log(`Unable to connect to the Mongo db  ${error} `);
        });
};

// use as a function        
connectDB();

/* JK - for setting up S3 bucket */
const s3 = new aws.S3({
    region: 'us-east-2',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AwS_SECRET_ACCESS_KEY
});

/* JK - To generate the URL whenever we want to upload an image in S3 bucket
   nanoid - used to generate the random ID
   getSignedUrlPromise - AWS function to get the Signed URL which is signed with the provided access key and secret key of AWS
*/
const generateUploadURL = async () => {

    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'blogging-website-jk',
        Key: imageName,
        Expires: 1000,
        ContentType: "image/jpeg"
    })
}

/* JK - To verify the access_token for the logged in user */
const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token == null){
        return res.status(401).json({ error: "No access token" })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if(err){
            return res.status(403).json({ error: "Access token is invalid" })
        }

        req.user = user.id
        next()
    })
}

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

/* JK - Upload image url route */
server.get("/get-upload-url", (req, res) => {
    generateUploadURL().then(url => res.status(200).json({ uploadURL : url }))
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error : err.message})
    })
})

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

/* JK - To save the blog 
    verifyJWT - middlewear helps to check if the user is logged in or not
*/
server.post('/create-blog', verifyJWT, (req, res) => {
    
    let authorId = req.user;

    let { title, des, banner, tags, content, draft } = req.body;

    if(!title.length){
        return res.status(403).json({ error: "You must provide a title" });
    }

    if(!draft){
        if(!des.length || des.length> 200){
            return res.status(403).json({ error: "You must provide blog description under 200 characters" });
        }
    
        if(!banner.length){
            return res.status(403).json({ error: "You must provide a blog banner ot publish it" });
        }
    
        if(!content.blocks.length){
            return res.status(403).json({ error: "There must be some blog content to publish it" });
        }
    
        if(!tags.length || tags.length > 10){
            return res.status(403).json({ error: "Provide tags in order to publish the blog, Maximum 10" });
        }
    }

    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();
    
    let blog = new Blog({
        title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
    })

    blog.save().then(blog => {

        let incrementVal = draft ? 0 : 1;

        User.findOneAndUpdate({ _id: authorId }, { $inc: {"account_info.total_posts" : incrementVal}, 
            $push : {"blogs": blog._id} })
        .then(user => {
            return res.status(200).json({ id: blog.blog_id });
        })
        .catch(err => {
            return res.status(500).json({ error: "Failed to update total posts number"});
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.listen(PORT, () => {
    console.log('listening on port: ' + PORT)
})