const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userController = {
  userSignup:async(req,res)=>{
    try{
        const {userId,userName, password}=req.body;
        const image = req.file;
        const existing = await User.findOne({userId});
        if(existing){
            return res.status(409).json({success:false, message:"User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({userId, userName, password:hashedPassword, image:image.path});
        await user.save();
        // res.status(201).json({message:"User registered successfully"});
    }catch(error){
        console.error(error);  
        // res.status(500).json({error:"Internal server error",details:error.message});
    }
},

userLogin: async (req, res) => {
  try {
    console.log("Received request body in userController: ", req.body);
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate a token
      const token = jwt.sign({userId: user.userId, userName: user.userName }, 'abc', {
        expiresIn: '24h', // Token expiry time
      });
      console.log("token:",token);
     return token;
      // res.status(200).json({ message: 'Login successful', token });
    } else {
      // res.status(401).json({ error: 'Unauthorized', details: 'Invalid credentials' });
      return null;
    }
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Internal Server Error', details: error.message });
    throw error;
  }
},

  getUsersList: async (req, res) => {
    try {
      const token = req.cookies.authToken;

      try {
        const decodedToken = jwt.verify(token, "abc");
        const loggedInUserId = decodedToken.userId;

        const users = await User.aggregate([
          { $match: { userId: { $ne: loggedInUserId } } },
          {
            $project: {
              _id: 0,
              userId: 1,
              userName: 1,
            },
          },
        ]); 
        
        return ({users});
        // res.status(200).json({ users: userStrings });
      } catch (verifyError) {
        console.error(verifyError);
        // res.status(401).json({ error: "Unauthorized", details: "Invalid token" });
        return null;
      }
    } catch (error) {
      console.error(error);
      // res.status(500).json({ error: "Internal Server Error", details: error.message });
      throw error;
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const users = await User.aggregate([
        {
          $project: {
            _id: 0,
            userId: 1,
            userName: 1,
            image: 1,
          },
        },
      ]);

      // res.status(200).json({ users });
      return users;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  editUser:async(req,res, userId)=>{
    try{
      const {userId, userName}= req.body;
      const image = req.file;

      const user = await User.findOne({userId});
      if(!user){
        return res.status(404).json({success:false, message:"user not found"});
      }

      user.userName = userName || user.userName;
      user.userId = userId || user.userId;
      user.image = image ? image.path :user.image;

      await user.save();
    }catch(error){
      console.error(error);
      throw error;
    }
  }

};

module.exports = userController;
