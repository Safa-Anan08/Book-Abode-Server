import { ObjectId } from "mongodb";

export interface Book {
  title: string;
  author: string;
  category: string;

  image: string;
  imagePublicId?: string;

  pdfUrl?: string;
  pdfPublicId?: string;

  price: number;
  rating: number;

  shortDescription: string;
  fullDescription: string;

  createdBy: string;
  createdAt: Date;
}