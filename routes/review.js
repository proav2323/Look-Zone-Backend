import express from "express";
import { ObjectId } from "mongodb";
import login from "../middlewares/login.js";
import jwt from "jsonwebtoken";

const reviewRouter = express.Router();

function calcStars(reviews) {
  let stars = 0;
  reviews.forEach((review) => {
    stars += review.stars;
  });

  return stars / reviews.length;
}

reviewRouter.post("/add/:id", login, async (req, res, next) => {
  const productId = req.params.id;
  await req.db.createCollection("products");
  await req.db.createCollection("users");

  let productCollection = req.db.collection("products");
  let usersCollection = req.db.collection("users");

  let context = req.body.context;
  let stars = req.body.stars;

  if (!stars || !context) {
    res.status(404).send("user didn't send the data");
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let product = await productCollection.findOne({
    _id: new ObjectId(productId),
  });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let review = product.reviews.find(
    (rev) => rev.userId.toString() === user._id.toString(),
  );

  if (review) {
    res.status(401).send("review already there");
    return;
  }

  let newReview = {
    userId: user._id,
    context: context,
    stars: stars,
  };

  product.reviews.push(newReview);

  let newReviews = product.reviews;
  let productStars = calcStars(newReviews);

  await productCollection.updateOne(
    { _id: new ObjectId(productId) },
    { $set: { reviews: newReviews, stars: productStars } },
  );

  let finalProduct = await productCollection.findOne({
    _id: new ObjectId(productId),
  });

  res.status(200).send(finalProduct);
});

reviewRouter.put("/update/:id", login, async (req, res, next) => {
  const productId = req.params.id;
  await req.db.createCollection("products");
  await req.db.createCollection("users");

  let productCollection = req.db.collection("products");
  let usersCollection = req.db.collection("users");

  let context = req.body.context;
  let stars = req.body.stars;

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let product = await productCollection.findOne({
    _id: new ObjectId(productId),
  });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let reviewIndex = product.reviews.findIndex(
    (review) => review.userId.toString() === user._id.toString(),
  );

  let review = product.reviews.find(
    (review) => review.userId.toString() === user._id.toString(),
  );

  if (!review) {
    res.status(404).send("review not found");
    return;
  }
  if (context) {
    product.reviews[reviewIndex].context = context;
  }
  if (stars) {
    product.reviews[reviewIndex].stars = stars;
  }
  let newReviews = product.reviews;

  let productStars = calcStars(newReviews);

  await productCollection.updateOne(
    { _id: new ObjectId(productId) },
    { $set: { reviews: newReviews, stars: productStars } },
  );

  let finalProduct = await productCollection.findOne({
    _id: new ObjectId(productId),
  });

  res.status(200).send(finalProduct);
});

reviewRouter.delete("/delete/:id", login, async (req, res, next) => {
  const productId = req.params.id;
  await req.db.createCollection("products");
  await req.db.createCollection("users");

  let productCollection = req.db.collection("products");
  let usersCollection = req.db.collection("users");

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let product = await productCollection.findOne({
    _id: new ObjectId(productId),
  });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let reviewIndex = product.reviews.findIndex(
    (review) => review.userId.toString() === user._id.toString(),
  );

  let review = product.reviews.find(
    (review) => review.userId.toString() === user._id.toString(),
  );

  if (!review) {
    res.status(404).send("review not found");
    return;
  }

  if (reviewIndex === 0) {
    product.reviews.shift();
  } else {
    product.reviews.slice(reviewIndex - 1, 1);
  }

  let newReviews = product.reviews;
  let productStars = calcStars(newReviews);

  await productCollection.updateOne(
    { _id: new ObjectId(productId) },
    { $set: { reviews: newReviews, stars: productStars } },
  );

  let finalProduct = await productCollection.findOne({
    _id: new ObjectId(productId),
  });

  res.status(200).send(finalProduct);
});

export default reviewRouter;
