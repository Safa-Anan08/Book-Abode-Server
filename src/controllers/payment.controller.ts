import { Request, Response } from "express";
import Stripe from "stripe";
import { getDB } from "../config/db";
import { ObjectId } from "mongodb";
import { Book } from "../types/book";
import { BookIdParams } from "../types/params";
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);


export const createCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookId } = req.body;


    if (!bookId || !ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid book id",
      });
      return;
    }


    const db = getDB();


    const book = await db
      .collection<Book>("books")
      .findOne({
        _id: new ObjectId(bookId),
      });


    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }


    const session =
      await stripe.checkout.sessions.create({

        payment_method_types: [
          "card",
        ],

        mode: "payment",


        success_url:
          `${process.env.CLIENT_URL}/payment/success?book=${bookId}`,


        cancel_url:
          `${process.env.CLIENT_URL}/books/${bookId}`,


        line_items: [
          {
            quantity: 1,

            price_data: {

              currency: "usd",

              unit_amount:
                Math.round(book.price * 100),


              product_data: {

                name: book.title,

                description:
                  book.shortDescription,

              },

            },

          },

        ],

      });


    res.status(200).json({

      success: true,

      url: session.url,

    });


  } catch (error) {

    console.log(
      "Checkout Error:",
      error
    );


    res.status(500).json({

      success:false,

      message:"Payment failed",

    });

  }
};





export const confirmPayment = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const {
      bookId
    } = req.body;


    if (!bookId) {

      res.status(400).json({

        success:false,

        message:"Book id required",

      });

      return;

    }


    const db = getDB();


    const existing =
      await db
      .collection("purchases")
      .findOne({

        userEmail:
          req.user!.email,

        bookId,

      });



    if (existing) {

      res.json({

        success:true,

        message:"Already purchased",

      });

      return;

    }



    await db
    .collection("purchases")
    .insertOne({

      userEmail:
        req.user!.email,

      bookId,


      status:"paid",


      purchasedAt:
        new Date(),

    });



    res.json({

      success:true,

      message:"Purchase saved",

    });



  } catch(error) {


    console.log(
      "Confirm Payment Error:",
      error
    );


    res.status(500).json({

      success:false,

    });


  }

};






export const canDownloadBook = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {


    const bookId =
      req.params.bookId;


    if (!bookId) {

      res.status(400).json({

        success:false,

      });

      return;

    }



    const db = getDB();


    const purchase =
      await db
      .collection("purchases")
      .findOne({

        userEmail:
          req.user!.email,


        bookId,


        status:"paid",

      });



    res.json({

      success:true,

      canDownload:
        !!purchase,

    });



  } catch(error) {


    res.status(500).json({

      success:false,

    });


  }

};







export const downloadBook = async (
  req: Request<BookIdParams>,
  res: Response
): Promise<void> => {


  try {


    const bookId =
      req.params.bookId;



    if (
      !bookId ||
      !ObjectId.isValid(bookId)
    ) {

      res.status(400).json({

        success:false,

        message:"Invalid book id",

      });


      return;

    }




    const db = getDB();



    const purchase =
      await db
      .collection("purchases")
      .findOne({

        userEmail:
          req.user!.email,


        bookId,


        status:"paid",

      });



    if (!purchase) {


      res.status(403).json({

        success:false,

        message:
          "Purchase required",

      });


      return;

    }




    const book =
      await db
      .collection<Book>("books")
      .findOne({

        _id:
          new ObjectId(bookId),

      });




    if (!book) {


      res.status(404).json({

        success:false,

        message:
          "Book not found",

      });


      return;

    }




    res.json({

      success:true,

      pdfUrl:
        book.pdfUrl,

    });



  } catch(error) {


    console.log(
      "Download Error:",
      error
    );


    res.status(500).json({

      success:false,

    });


  }

};