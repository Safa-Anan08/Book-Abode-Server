import multer from "multer";

export const pdfUpload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) {
        return cb(null, true);
      }

      return cb(
        new Error("Only image files are allowed.")
      );
    }

    if (file.fieldname === "pdf") {
      if (file.mimetype === "application/pdf") {
        return cb(null, true);
      }

      return cb(
        new Error("Only PDF files are allowed.")
      );
    }

    cb(new Error("Invalid file field."));
  },

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
export default pdfUpload;