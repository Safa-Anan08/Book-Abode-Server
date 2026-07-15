import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { getDB } from "../config/db";
import { generateToken } from "../utils/jwt";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";




const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);



export const googleLogin = async (
  req: Request,
  res: Response
) => {

  try {

    const { credential } = req.body;


    if (!credential) {
      return res.status(400).json({
        success:false,
        message:"Google credential missing"
      });
    }



    

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });



    const payload =
      ticket.getPayload();



    if(!payload){
      return res.status(400).json({
        success:false,
        message:"Invalid Google token"
      });
    }



    const {
      email,
      name,
      picture
    } = payload;



    const db = getDB();


    const users =
      db.collection("users");



    let user =
      await users.findOne({
        email
      });



    if(!user){

      const newUser = {

        name:name || "Google User",

        email,

        image:
          picture || "",

        role:"user",

        createdAt:
          new Date()

      };


      const result =
        await users.insertOne(
          newUser
        );


      user = {
        ...newUser,
        _id:
          result.insertedId
      };

    }



    const token =
      jwt.sign(
        {
          id:user._id,
          role:user.role
        },
        process.env.JWT_SECRET!,
        {
          expiresIn:"7d"
        }
      );

    res.cookie(
      "token",
      token,
      {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"lax",
        maxAge:
          7*24*60*60*1000
      }
    );



    res.json({

      success:true,

      message:
        "Google login successful",

      user

    });



  } catch(error){

    console.log(error);


    res.status(500).json({

      success:false,

      message:
        "Google login failed"

    });

  }

};
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, photo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const db = getDB();

    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

   const hashedPassword = await bcrypt.hash(password, 10);

const user = {
  name,
  email,
  password: hashedPassword,

  role: "user",

  image:
    photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C3955B&color=261311`,

  imagePublicId: "",

  createdAt: new Date(),
};

const result = await db.collection("users").insertOne(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      userId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const db = getDB();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id.toString());

    res.cookie("token", token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite:
           process.env.NODE_ENV === "production"
           ? "none"
           : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
});

  res.json({
    success: true,
    message: "Logged out",
  });
};

export const me = async (req: Request, res: Response) => {
  res.json(req.user);
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.user!._id),
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image || "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const db = getDB();

    const userId = req.user!._id;

    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
      });
    }

    let image = user.image;
    let imagePublicId = user.imagePublicId;

    if (req.file) {
      if (imagePublicId) {
        await cloudinary.uploader.destroy(imagePublicId);
      }

      const uploadResult: any = await new Promise(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder: "bookabode/users",
              },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );

         
streamifier
  .createReadStream((req as any).file.buffer)
  .pipe(stream); }
      );

      image = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    await db.collection("users").updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          name: req.body.name,
          image,
          imagePublicId,
        },
      }
    );

    res.json({
      success: true,
      message: "Profile updated",
      image,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};