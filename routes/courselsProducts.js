import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import auth from "../middlewares/auth.js";
import generateId from "../generateId.js";
import adminView from "../middlewares/adminView.js";

const courselRouter = express.Router();

courselRouter.get("/", async (req, res, next) => {
  await req.db.createCollection("courselproducts");
  let courselCollection = req.db.collection("courselproducts");

  let courselCursor = courselCollection.find({});
  let coursels = [];

  for await (let coursel of courselCursor) {
    coursels.push(coursel);
  }

  res.status(200).send(coursels);
});

courselRouter.get("/search", adminView, async (req, res, next) => {
  await req.db.createCollection("courselproducts");
  let courselCollection = req.db.collection("courselproducts");

  await courselCollection.createIndex({ heading: "text", subText: "text" });
  let search = req.query.search;

  if (!search) {
    res.status(404).send("wrong url");
    return;
  }

  let courselCursor = courselCollection.find({ $text: { $search: search } });
  let coursels = [];

  for await (let coursel of courselCursor) {
    coursels.push(coursel);
  }

  res.status(200).send(coursels);
});

courselRouter.get("/coursel/:id", auth, async (req, res, next) => {
  const courselId = req.params.id;
  await req.db.createCollection("courselproducts");
  let courselCollection = req.db.collection("courselproducts");

  try {
    let coursel = await courselCollection.findOne({
      _id: new ObjectId(courselId),
    });

    res.status(200).send(coursel);
  } catch (Er) {
    res.status(500).send(Er.message);
  }
});

courselRouter.post("/add", auth, async (req, res, next) => {
  await req.db.createCollection("courselproducts");
  let courselCollection = req.db.collection("courselproducts");

  let heading = req.body.heading;
  let subText = req.body.subText;
  let productId = req.body.productId;

  if (!heading || !subText || !productId) {
    res.status(404).send("user didn't send the data");
    return;
  }

  let product = req.db
    .collection("products")
    .findOne({ _id: new ObjectId(productId) });

  if (!product) {
    res.status(404).send("product not found");
    return;
  }

  let newCoursel = {
    productId: productId,
    heading: heading,
    subText: subText,
    id: generateId(8),
  };

  await courselCollection.insertOne(newCoursel);

  res.status(200).send("coursel added");
});

courselRouter.put("/update/:id", auth, async (req, res, next) => {
  const courselId = req.params.id;
  await req.db.createCollection("courselproducts");
  let courselCollection = req.db.collection("courselproducts");

  let heading = req.body.heading;
  let subText = req.body.subText;

  let coursel = await courselCollection.findOne({
    _id: new ObjectId(courselId),
  });

  if (!coursel) {
    res.status(404).send("coursel not found");
    return;
  }

  try {
    await courselCollection.updateOne(
      { _id: new ObjectId(courselId) },
      {
        $set: {
          heading: heading ? heading : coursel.heading,
          subText: subText ? subText : coursel.subText,
        },
      },
    );

    res.status(200).send("coursel updated");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

courselRouter.delete("/delete/:id", auth, async (req, res, next) => {
  const courselId = req.params.id;
  await req.db.createCollection("courselproducts");
  let courselCollection = req.db.collection("courselproducts");

  let coursel = await courselCollection.findOne({
    _id: new ObjectId(courselId),
  });

  if (!coursel) {
    res.status(404).send("product not found");
    return;
  }

  try {
    await courselCollection.deleteOne({ _id: new ObjectId(courselId) });

    res.status(200).send("coursel deleted");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default courselRouter;
