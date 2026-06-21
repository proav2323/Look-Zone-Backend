import express from "express";
import { ObjectId } from "mongodb";

const productRouter = express.Router();

productRouter.get("/", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");

  let productsCursor = productsCollection.find({});
  let products = [];

  for await (let product of productsCursor) {
    products.push(product);
  }

  res.status(200).send(products);
});

export default productRouter;
