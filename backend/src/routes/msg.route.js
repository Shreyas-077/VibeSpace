import express from 'express';
import {protectRoute} from '../middlewares/auth.middleware.js';
import {sendMessage,getMessages,getUsersBySideBar} from '../controllers/msg.controller.js';

const router = express.Router();

router.post("/send/:id",protectRoute,sendMessage);
router.get("/user",protectRoute,getUsersBySideBar);
router.get("/:id",protectRoute,getMessages);


export default router;