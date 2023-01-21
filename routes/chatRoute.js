import express from "express";
import ChatSchema from "../models/Chat.js"

const router = express.Router();

// CREATE CHAT
router.post("/",async(req,res)=>{
    const members = [req.body.senderId,req.body.recieverId];
    const newChat = new ChatSchema({
        members:members
    });
    try {
        const result = await newChat.save();
        res.status(200).json(result);
    } catch (err) {
        res.status(515).json(err);
    }
});

// USER CHATS
router.get("/:userId",async(req,res)=>{
    const userId = req.params.userId;
    try {
        const chat = await ChatSchema.find({
            members:{$in:[userId]}
        })
        res.status(200).json(chat)
    } catch (err) {
        res.status(515).json(err)
    }
});

// FIND CHAT
router.get("/find/:firstId/:secondId",async(req,res)=>{
    const firstId = req.params.firstId;
    const secondId = req.params.secondId;
    try {
        const chat = await ChatSchema.findOne({
            members:{$all:[firstId,secondId]}
        })
        res.status(200).json(chat);
    } catch (err) {
        res.status(515).json(err);
    }
});

export default router;