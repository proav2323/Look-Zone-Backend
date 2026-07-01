import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import login from "../middlewares/login.js";
import auth from "../middlewares/auth.js";
import adminView from "../middlewares/adminView.js";

const ordersRouter = express.Router();

ordersRouter.get("/", adminView, async (req, res, next) => {
  await req.db.createCollection("orders");
  let ordersCollection = req.db.collection("orders");

  let ordersCursor = await ordersCollection.find({});
  let orders = [];

  for await (let newOrder of ordersCursor) {
    orders.push(newOrder);
  }

  res.status(200).send(orders);
});

ordersRouter.get("/status", adminView, async (req, res, next) => {
  await req.db.createCollection("orders");
  let ordersCollection = req.db.collection("orders");
  let status = req.query.search;

  if (!status) {
    res.status(404).send("worng url");
    return;
  }

  let ordersCursor = ordersCollection.find({
    status: status,
  });
  let orders = [];

  for await (let newOrder of ordersCursor) {
    orders.push(newOrder);
  }

  res.status(200).send(orders);
});

ordersRouter.get("/date", adminView, async (req, res, next) => {
  await req.db.createCollection("orders");
  let ordersCollection = req.db.collection("orders");
  let dateStart = req.query.dateStart;
  let dateEnd = req.query.dateEnd;

  if (!dateEnd || !dateStart) {
    res.status(404).send("wrong url");
    return;
  }

  let ordersCursor = ordersCollection.find({
    date: { $gte: new Date(dateStart), $lte: new Date(dateEnd) },
  });
  let orders = [];

  for await (let newOrder of ordersCursor) {
    orders.push(newOrder);
  }

  res.status(200).send(orders);
});

ordersRouter.get("/filter", adminView, async (req, res, next) => {
  await req.db.createCollection("orders");
  let ordersCollection = req.db.collection("orders");
  let dateStart = req.query.dateStart;
  let dateEnd = req.query.dateEnd;
  let status = req.query.status;

  if (!dateEnd || !dateStart || !status) {
    res.status(404).send("wrong url");
    return;
  }

  let ordersCursor = ordersCollection.find({
    date: { $gte: new Date(dateStart), $lte: new Date(dateEnd) },
    status: status,
  });
  let orders = [];

  for await (let newOrder of ordersCursor) {
    orders.push(newOrder);
  }

  res.status(200).send(orders);
});

ordersRouter.get("/order/:id", login, async (req, res, next) => {
  const orderId = req.params.id;
  await req.db.createCollection("orders");
  let ordersCollection = req.db.collection("orders");

  let order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

  res.status(200).send(order);
});

ordersRouter.post("/place", login, async (req, res, next) => {
  await req.db.createCollection("orders");
  let ordersCollection = req.db.collection("orders");
  let usersCollection = req.db.collection("users");

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  if (user.cart.products.length <= 0) {
    res.status(404).send("cart is empty");
    return;
  }

  if (user.address.addressMade === false) {
    res.status(401).send("user need to save his/her address");
    return;
  }

  let newOrder = {
    cart: user.cart,
    address: user.address,
    payment: user.cart.totalPrice,
    date: new Date(Date.now()),
    status: "ordered",
    userId: user._id,
  };

  let order = await ordersCollection.insertOne(newOrder);
  user.orders.push(order.insertedId);
  let userOrders = user.orders;
  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        orders: userOrders,
        cart: { products: [], totalPrice: 0, id: user.cart.id },
      },
    },
  );

  res.status(200).send("order placed");
});

ordersRouter.put("/cancel/:id", login, async (req, res, next) => {
  let orderId = req.params.id;

  await req.db.createCollection("orders");

  let ordersCollection = req.db.collection("orders");
  let usersCollection = req.db.collection("users");

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

  if (order.status === "processing" || order.status === "ordered") {
    ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: "canceled" } },
    );

    res.status(200).send("order cenceled");
  } else {
    res.status(401).send("order can't be canceled at this point of time");
  }
});

ordersRouter.put("/return/:id", login, async (req, res, next) => {
  let orderId = req.params.id;

  await req.db.createCollection("orders");

  let ordersCollection = req.db.collection("orders");
  let usersCollection = req.db.collection("users");

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

  if (order.status === "delivered") {
    ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: "return intiated" } },
    );

    res.status(200).send("order set for return");
  } else {
    res.status(401).send("order is not delivered yet");
  }
});

ordersRouter.put("/status/:id", auth, async (req, res, next) => {
  let orderId = req.params.id;

  await req.db.createCollection("orders");

  let ordersCollection = req.db.collection("orders");
  let usersCollection = req.db.collection("users");

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  let status = req.body.status;

  if (!status) {
    res.status(404).send("invalid status");
    return;
  }

  ordersCollection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { status: status } },
  );

  res.status(200).send(`order set for ${status}`);
});

export default ordersRouter;
