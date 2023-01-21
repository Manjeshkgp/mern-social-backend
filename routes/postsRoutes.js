import { Router } from "express";
import userSchema from "../models/User.js";
import postSchema from "../models/Post.js";
import passport from "passport";
import multer from "multer";
import fs from "fs";
import mongoose from "mongoose";

const router = Router();
const auth = passport.authenticate("jwt", { session: false });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "posts");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// SEND POST
router.post(
  "/users/post/:id",
  auth,
  upload.single("postImage"),
  async (req, res) => {
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
    const saveImage = await new postSchema({
      description: req.body.description,
      postedBy: userExist.username,
      postedByProfileImage: userExist.profileImage.imgUrl
        ? userExist.profileImage.imgUrl
        : "",
      contentType: "image/png",
      imgUrl: req.file.path,
    });
    saveImage
      .save()
      .then((result) => {
        console.log("Image Saved Successfully");
      })
      .catch((err) => {
        console.log(err);
      });
    userExist.posts.push(saveImage);
    userExist
      .save()
      .then((result) => {
        console.log("Post added to Posts");
      })
      .catch((err) => {
        console.log(err);
      });
    // console.log(userExist, _id.length);
    res.json({ message: "Image Saved Successfully" });
    console.log(req.file.path);
  }
);

// GET POSTS // not much useful cause another route is doing the bigger work including this

// router.get("/users/post/:id",auth,async(req,res)=>{
//   const _id = req.params.id;
//   if (_id.length !== 24) {
//     res.status(406).json({ message: `${_id} is invalid` });
//     return;
//   }
//   const userExist = await userSchema.findOne({ _id: _id });
//   if (!userExist || userExist === null) {
//     res.status(403).json({ message: "User not found" });
//     console.log(userExist);
//     return;
//   }
//   res.json({posts:userExist?.posts});
// })

// GET POSTS FOR HOME PAGE

router.get("/allposts", auth, async (req, res) => {
  const page = req.query.page || 0;
  const postsPerPage = 20;
  // const _id = req.params.id;
  // if (_id.length !== 24) {
  //   res.status(406).json({ message: `${_id} is invalid` });
  //   return;
  // }
  const allposts = await postSchema.find().sort({ postedAt: -1 }).skip(page*postsPerPage).limit(postsPerPage);
  res.json({ allposts: allposts });
});

// LIKE AND UNLIKE A POST

router.post("/allposts/like/:username", auth, async (req, res) => {
  const username = req.params.username;
  const postId = req.body.postId;

  const thePost = await postSchema.findOne({ _id: postId });
  const postedBy = await thePost?.postedBy;
  if (thePost.likesArray.some((obj) => obj.username === username)) {
    await postSchema
      .findOneAndUpdate(
        { _id: postId },
        { $pull: { likesArray: { username: { $eq: username } } } }
      )
      .then((res) => console.log("unliked the post"))
      .catch((err) => console.log(err));
    await userSchema
      .findOneAndUpdate(
        { username: postedBy },
        {
          $pull: {
            "posts.$[post].likesArray": { username: { $eq: username } },
          },
        },
        { arrayFilters: [{ "post._id": postId }] }
      )
      .then((result) => {
        console.log("unliked post pushed");
      })
      .catch((err) => console.log(err));
    res.status(209).json({ message: "Post unliked" });
  } else {
    await thePost.likesArray.push({ username: username });
    await thePost.save();
    console.log("thePost is liked");
    await userSchema
      .findOneAndUpdate(
        { username: postedBy },
        { $addToSet: { "posts.$[post].likesArray": { username: username } } }, // used $addToSet instead of $pull since addToSet checks if already the element is available or not
        { arrayFilters: [{ "post._id": postId }] }
      )
      .then((result) => {
        console.log("liked post pushed");
      })
      .catch((err) => console.log(err));
    res.status(200).json({ message: "Liked the post" });
  }
});

// COMMENT ON A POST

router.post("/allposts/comment/:username", auth, async (req, res) => {
  const username = req.params.username;
  const postId = req.body.postId;
  const commentString = req.body.commentString;
  // const commentID = req.body.commentID;

  if (postId.length !== 24) {
    res.status(406).json({
      message: `The ID of post you given is ${postId}, it is incorrect`,
    });
  }
  const thePost = await postSchema.findOne({ _id: postId });
  const postedBy = await thePost?.postedBy;
  // if (thePost.comments.some((obj) => obj.username === username && obj.commentID === commentID)) {
  //   await postSchema
  //     .findOneAndUpdate(
  //       { _id: postId },
  //       { $pull: { comments: { commentID: { $eq: commentID } } } }
  //     )
  //     .then((res) => console.log("unliked the post"))
  //     .catch((err) => console.log(err));
  //   await userSchema
  //     .findOneAndUpdate(
  //       { username: postedBy },
  //       {
  //         $pull: {
  //           "posts.$[post].comments": { commentID: { $eq: commentID } },
  //         },
  //       },
  //       { arrayFilters: [{ "post._id": postId }] }
  //     )
  //     .then((result) => {
  //       console.log("unliked post pushed");
  //     })
  //     .catch((err) => console.log(err));
  //   res.status(209).json({ message: "Post unliked" });
  // } else {
  await thePost.comments.push({
    username: username,
    commentString: commentString,
    commentID: mongoose.Types.ObjectId(),
  });
  await thePost.save();
  console.log("thePost is commented", thePost); // PROBLEM mongoose.Types.ObjectId() generating different Ids for both time check
  const newCommentsArray = await thePost.comments;
  await userSchema
    .findOneAndUpdate(
      { username: postedBy },
      { $set: { "posts.$[post].comments": newCommentsArray } },
      { arrayFilters: [{ "post._id": postId }] }
    )
    .then((result) => {
      console.log("commented post pushed", result);
    })
    .catch((err) => console.log(err));
  res.status(200).json({ message: "commented the post" });
  // }
});

// GET COMMENTS OF A POST

router.get("/allposts/:postId/comments", auth, async (req, res) => {
  const postId = req.params.postId;
  const thePost = await postSchema.findOne({
    _id: mongoose.Types.ObjectId(postId),
  });
  const theComments = thePost?.comments;
  res.json({ data: theComments });
});

// DELETE A COMMENT FROM A POST

router.delete("/allposts/comment/:username", auth, async (req, res) => {
  // const username = req.params.username;
  const postId = req.body.postId;
  const commentID = req.body.commentID;

  if (postId.length !== 24 || commentID.length !== 24) {
    res.status(406).json({
      message: `The ID of post you given is ${postId}, it is incorrect`,
    });
  }
  const thePost = await postSchema.findOneAndUpdate(
    { _id: postId },
    { $pull: { comments: { commentID: mongoose.Types.ObjectId(commentID) } } }
  );

  const postedBy = await thePost?.postedBy;
  await userSchema
    .findOneAndUpdate(
      { username: postedBy },
      {
        $pull: {
          "posts.$[post].comments": {
            commentID: mongoose.Types.ObjectId(commentID),
          },
        },
      },
      { arrayFilters: [{ "post._id": mongoose.Types.ObjectId(postId) }] }
    )
    .then((result) => {
      console.log("deleted commented post pushed", result);
    })
    .catch((err) => console.log(err));
  res.status(200).json({ message: "comment deleted" });
});

export default router;
