import bcrypt from "bcrypt";
import { getDB } from "../config/db";

export const seedAdmin = async () => {
  try {
    const db = getDB();

    const email = "admin@gmail.com";

    const existingAdmin = await db
      .collection("users")
      .findOne({ email });

    if (existingAdmin) {
      console.log("✅ Admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      "admin@123",
      10
    );

    await db.collection("users").insertOne({
      name: "Administrator",
      email,
      password: hashedPassword,
      role: "admin",
      photo: "",
      createdAt: new Date(),
    });

    console.log(
      "🎉 Default admin created successfully."
    );

    console.log(
      "Email: admin@gmail.com"
    );

    console.log(
      "Password: admin@123"
    );
  } catch (error) {
    console.error(
      "Seed Admin Error:",
      error
    );
  }
};