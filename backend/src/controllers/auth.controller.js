import User from '../models/users.js';
import bcrypt from 'bcryptjs';
import {getToken} from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async(req, res) => {
    let {email, fullName, password} = req.body;
    try {
        if(!email || !fullName || !password) {
            return res.status(400).json({error: "All fields are required"});
        }
        if(password.length < 6) {
            return res.status(400).json({error: "Password must be at least 6 characters long"});
        }
        const checkEmail = await User.findOne({email});
        if(checkEmail) {
            return res.status(400).json({error: "Email already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            fullName,
            password: hashPass
        });
        if(newUser) {
            getToken(newUser._id,res);
            await newUser.save();
            return res.status(201).json({message: "User created successfully"});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"});
    }
};

export const login = async(req, res) => {
    let {email, password} = req.body;
    try{
        if(!email || !password) {
            return res.status(400).json({error: "All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({error: "Invalid credentials"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({error: "Invalid credentials"});
        }
        getToken(user._id,res);
        return res.status(200).json({message: "Login successful"});

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"});
    }

};

export const logout = (req, res) => {
    try{
        res.cookie("jwt","",{maxAge : 0});
        return res.status(200).json({message: "Logout successful"});
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"});
    }
};

export const updateProfile = async (req, res) => {
    try {
      const { profilePic } = req.body;
      const userId = req.user._id;
  
      if (!profilePic) {
        return res.status(400).json({ message: "Profile pic is required" });
      }
  
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      );
  
      res.status(200).json(updatedUser);
    } catch (error) {
      console.log("error in update profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"});
    }
};


