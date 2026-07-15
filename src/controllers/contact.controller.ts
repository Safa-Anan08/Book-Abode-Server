import { Request, Response } from "express";
import { getDB } from "../config/db";


export const sendMessage = async(
 req:Request,
 res:Response
)=>{

 try{

  const db = getDB();

  const {
    name,
    email,
    subject,
    message
  } = req.body;


  if(!name || !email || !message){
    return res.status(400).json({
      success:false,
      message:"Required fields missing"
    });
  }


  await db.collection("contacts").insertOne({

    name,
    email,
    subject,
    message,
    createdAt:new Date()

  });


  res.json({
    success:true,
    message:"Message sent successfully"
  });


 }catch(error){

  res.status(500).json({
    success:false,
    message:"Server error"
  });

 }

};