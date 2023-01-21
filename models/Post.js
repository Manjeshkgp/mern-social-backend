import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    description:String,
    contentType:String,
    postedBy:String,
    postedByProfileImage:String,
    imgUrl:String,
    likesArray:[Object],
    comments:[Object],
    postedAt:{ type: Date, default: Date.now }
})

export default new mongoose.model("Post",postSchema);