import express from "express";
import userSchema from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

// REGISTER

router.post("/register", async (req, res) => {
  const { name, email, password, username } = await req.body;
  //check if user exists with same email
  const userExist = await userSchema.findOne({ email });
  const usernameExist = await userSchema.findOne({username:username.toLowerCase()});
  if (userExist) {
    res.status(406).json({ message: "User Already Existed" });
    return;
  }
  if(usernameExist){
    res.status(406).json({message:"Username Alrady Taken"});
    return;
  }

  //hash the password
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // store user
  const registerUser = new userSchema({
    name: name,
    email: email,
    username:username.toLowerCase(),
    password: hashedPassword,
  });

  const saveUser = await registerUser.save();
  console.log(saveUser);
  res.status(200).json({ message: "User is Created" });
});

// LOGIN

router.post("/login", async (req, res) => {
  const { email, password } = await req.body;
  const user = await userSchema.findOne({ email });
  if (!user) {
    res.status(406).json({ message: "User not found" });
    return;
  }
  const matched = await bcrypt.compareSync(password, user.password);
  if (!matched) {
    res.status(401).json({ message: "Password Incorrect" });
    return;
  }

  // When user email & password is correct, create jwt token

  const payload = {
    email: email,
    _id: user?._id,
    password,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET);
  res.json({ message: "successfully logged in", token, user });
});

// passport.authenticate("jwt", { session: false }) // by using this just after any data api like user's posts api, the api will become user protected

// // SEND PROFILE IMAGE
router.post(
  "/users/:id",
  passport.authenticate("jwt", { session: false }),
  upload.single("profileImage"),
  async (req, res) => {
    const description = req.body.description;
    const _id = req.params.id;
    if (_id.length !== 24) {
      res.status(406).json({ message: `${_id} is invalid` });
      return;
    }
    const userExist = await userSchema.findOne({ _id: _id });
    if (!userExist || userExist === null) {
      res.status(403).json({ message: "User not found" });
      console.log(userExist);
      return;
    }
    const saveImage = await userSchema.findOneAndUpdate(
      { _id: _id },
      {
        $set: {
          profileImage: {
            contentType: "image/png",
            imgUrl:req.file.path,
          },
          description:description,
        },
      }
    );
    saveImage.save().then((result)=>{console.log("Image & description Saved Successfully")}).catch((err)=>{console.log(err)})
    // console.log(userExist, _id.length);
    res.json({message:"Image & Description Saved Successfully" });
  }
);

// GET PROFILE DATA

router.get("/users/:id",passport.authenticate("jwt",{session:false}),async(req,res)=>{
  const _id = req.params.id;
  const {profileImage,posts,username,name,followers,following,description} = await userSchema.findOne({_id:_id})
  const image = profileImage.imgUrl
  res.json({image,posts,username,name,followers,following,description});
})

// GET PROFILE DATA BY USERNAME

router.get("/user/:username",passport.authenticate("jwt",{session:false}),async(req,res)=>{
  const theirUsername = req.params.username;
  const {profileImage,posts,username,name,followers,following,description,_id} = await userSchema.findOne({username:theirUsername})
  const image = profileImage.imgUrl;
  res.json({image,posts,username,name,followers,following,description,_id});
})

// TESTING AUTHENTICATION

router.post(
  "/authentication",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const userData = req.user;
    res.status(200).json({ data: userData });
  }
);

// FOLLOW, FOLLOWING ROUTE
// we have to update both users at single time, one get a push in followers array and another one will get a push in following array

router.post("/user/follow/:username",passport.authenticate("jwt",{session:false}),async(req,res)=>{
  const followerUsername = req.body.myUsername;
  const followingUsername = req.params.username;

  if(followerUsername === followingUsername){res.status(481).json({message:"don't try to follow yourself"});return;}

  const theFollower = await userSchema.findOneAndUpdate({username:followerUsername},
    {$addToSet:{following:{username:followingUsername}}});
  const theFollowing = await userSchema.findOneAndUpdate({username:followingUsername},
    {$addToSet:{followers:{username:followerUsername}}});

    console.log("follower",theFollower)
    console.log("following",theFollowing)
    res.json({message:"follow details added"});
})

// UNFOLLOW ROUTE
// pull from both following and followers

router.post("/user/unfollow/:username",async(req,res)=>{
  const followerUsername = req.body.myUsername;
  const followingUsername = req.params.username;

  const theFollower = await userSchema.findOneAndUpdate({username:followerUsername},
    {$pull:{following:{username:followingUsername}}});
  const theFollowing = await userSchema.findOneAndUpdate({username:followingUsername},
    {$pull:{followers:{username:followerUsername}}});

    console.log("follower",theFollower)
    console.log("following",theFollowing)
    res.json({message:"follow details updated"});
});

// SEARCH USERS REGEX

router.get("/allusers/:username",passport.authenticate("jwt",{session:false}),async(req,res)=>{
  const username = req.params.username;
  const usersArray = await userSchema.find({"username":{$regex:username}}).limit(8)
  res.json({usersArray:usersArray});
})

// SEARCH USER WHO RECENTLY JOINED FOR HOME SUGGESTIONS

router.get("/allusers",passport.authenticate("jwt",{session:false}),async(req,res)=>{
  const usersArray = await userSchema.find().sort({joinedOn:-1}).limit(8)
  res.json({usersArray:usersArray});
})

export default router;
