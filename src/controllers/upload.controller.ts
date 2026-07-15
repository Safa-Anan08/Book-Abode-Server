import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
export const uploadPdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });

      return;
    }
const streamifier = require("streamifier");

const stream = cloudinary.uploader.upload_stream(
  {
    resource_type: "raw",
    folder: "bookabode/pdfs",
  },
  (
    error: UploadApiErrorResponse | undefined,
    result: UploadApiResponse | undefined
  ) => {
    if (error || !result) {
      return res.status(500).json({
        success: false,
        message: "Upload failed.",
      });
    }

    return res.json({
      success: true,
      url: result.secure_url,
    });
  }
);

streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};