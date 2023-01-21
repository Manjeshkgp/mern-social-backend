import express from "express";
import MessageSchema from "../models/Message.js"

const router = express.Router();

// ADD MESSAGE
router.post("/",async(req,res)=>{
    const chatId = req.body.chatId;
    const senderId = req.body.senderId;
    const text = req.body.text;
    const message = new MessageSchema({
        chatId:chatId,
        senderId:senderId,
        text:text,
    })
    try {
        const result = await message.save();
        res.status(200).json(result);
    } catch (err) {
        res.status(515).json(err);
    }
});

// GET MESSAGES
router.get("/:chatId",async(req,res)=>{
    const chatId = req.params.chatId;
    try {
        const result = await MessageSchema.find({chatId});
        res.status(200).json(result);
    } catch (err) {
        res.status(515).json(err);
    }
});

export default router;