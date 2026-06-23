import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import login from "../middlewares/login.js";

const cartRouter = express.Router();

cartRouter.post("/add/:id", login, async (req, res, next) => {
  const productId = req.params.id;
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let product = await req.db
    .collection("products")
    .findOne({ _id: new ObjectId(productId) });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let cartProduct = user.cart.products.find((item) => item.id === productId);

  if (cartProduct) {
    res.status(401).send("item already added");
    return;
  }

  user.cart.products.push({
    id: productId,
    qty: 1,
    price: product.price,
  });
  let newProducts = user.cart.products;
  let newTotalPrice = user.cart.totalPrice + product.price;

  await usersCollection.updateOne(
    { email: decoded.email },
    {
      $set: {
        cart: {
          id: user.cart.id,
          products: newProducts,
          totalPrice: newTotalPrice,
        },
      },
    },
  );

  const newUser = await usersCollection.findOne({ email: decoded.email });

  return res.status(200).send(newUser);
});

cartRouter.put("/increase/:id", login, async (req, res, next) => {
  const productId = req.params.id;
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });
  let product = await req.db
    .collection("products")
    .findOne({ _id: new ObjectId(productId) });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let cartProductIndex = user.cart.products.findIndex(
    (item) => item.id === productId,
  );

  if (user.cart.products[cartProductIndex].qty >= product.stock) {
    res.status(401).send("item out of stock");
    return;
  }

  user.cart.products[cartProductIndex].qty += 1;
  let newProducts = user.cart.products;
  let newTotalPrice = user.cart.totalPrice + product.price * 1;

  await usersCollection.updateOne(
    { email: decoded.email },
    {
      $set: {
        cart: {
          id: user.cart.id,
          products: newProducts,
          totalPrice: newTotalPrice,
        },
      },
    },
  );

  const newUser = await usersCollection.findOne({ email: decoded.email });

  res.status(200).send(newUser);
});

cartRouter.put("/decrease/:id", login, async (req, res, next) => {
  const productId = req.params.id;
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let product = await req.db
    .collection("products")
    .findOne({ _id: new ObjectId(productId) });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let cartProductIndex = user.cart.products.findIndex(
    (item) => item.id === productId,
  );

  if (user.cart.products[cartProductIndex].qty === 1) {
    await removeItem(req, res, next);
  } else {
    user.cart.products[cartProductIndex].qty -= 1;
    let newProducts = user.cart.products;
    let newTotalPrice = user.cart.totalPrice - product.price * 1;

    await usersCollection.updateOne(
      { email: decoded.email },
      {
        $set: {
          cart: {
            id: user.cart.id,
            products: newProducts,
            totalPrice: newTotalPrice,
          },
        },
      },
    );

    const newUser = await usersCollection.findOne({ email: decoded.email });

    res.status(200).send(newUser);
  }
});

async function removeItem(req, res, next) {
  const productId = req.params.id;
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let product = await req.db
    .collection("products")
    .findOne({ _id: new ObjectId(productId) });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let cartProductIndex = user.cart.products.findIndex(
    (item) => item.id === productId,
  );
  let cartProduct = user.cart.products.find((item) => item.id === productId);

  if (!cartProduct) {
    res.status(404).send("item not found");
    return;
  }

  if (cartProductIndex === 0) {
    user.cart.products.shift();
  } else {
    user.cart.products = user.cart.products.slice(cartProductIndex - 1, 1);
  }
  let newProducts = user.cart.products;
  let newTotalPrice = user.cart.totalPrice - product.price * cartProduct.qty;

  await usersCollection.updateOne(
    { email: decoded.email },
    {
      $set: {
        cart: {
          id: user.cart.id,
          products: newProducts,
          totalPrice: newTotalPrice,
        },
      },
    },
  );

  const newUser = await usersCollection.findOne({ email: decoded.email });

  res.status(200).send(newUser);
}

cartRouter.delete("/delete/:id", login, removeItem);

export default cartRouter;
