import { Router } from "express";
import { sendMessage } from "../controllers/contact.controller";

const router = Router();


router.post("/",sendMessage);


export default router;