import express from "express";
import { ObjectId } from "mongodb";
import auth from "../middlewares/auth.js";

const categoryRouter = express.Router();

categoryRouter.get("/", async (req, res, next) => {
  await req.db.createCollection("categories");
  let categoryCollection = req.db.collection("categories");

  let categoryCursor = categoryCollection.find({});
  let category = [];

  for await (let newCategory of categoryCursor) {
    category.push(newCategory);
  }

  res.status(200).send(category);
});

categoryRouter.get("/category/:id", async (req, res, next) => {
  await req.db.createCollection("categories");
  let categoryCollection = req.db.collection("categories");
  let categoryId = req.params.id;

  if (categoryId) {
    try {
      let category = await categoryCollection.findOne({
        _id: new ObjectId(categoryId),
      });
      if (category) {
        res.status(200).send(category);
      } else {
        res.status(404).send("category not found");
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("not a proper url");
  }
});

categoryRouter.post("/add", auth, async (req, res, next) => {
  await req.db.createCollection("categories");
  let categoryCollection = req.db.collection("categories");

  let name = req.body.name;

  if (name) {
    let category = await categoryCollection.findOne({
      name: name.toLowerCase(),
    });

    if (category) {
      res.status(401).send("category found");
      return;
    }
    try {
      let newCatgeory = await categoryCollection.insertOne({
        name: name.toLowerCase(),
      });
      res.status(200).send("added successfully");
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("user did not send data");
  }
});

categoryRouter.put("/update/:id", auth, async (req, res, next) => {
  await req.db.createCollection("categories");
  let categoryCollection = req.db.collection("categories");

  const categoryId = req.params.id;
  let name = req.body.name;

  if (name && categoryId) {
    let category = await categoryCollection.findOne({
      _id: new ObjectId(categoryId),
    });

    if (category) {
      try {
        await categoryCollection.updateOne(
          {
            _id: new ObjectId(categoryId),
          },
          {
            $set: {
              name: name,
            },
          },
        );
        res.status(200).send("updated successfully");
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(401).send("category not found");
    }
  } else {
    res.status(404).send("user did not send data or no a proper url");
  }
});

categoryRouter.delete("/delete/:id", auth, async (req, res, next) => {
  await req.db.createCollection("categories");
  let categoryCollection = req.db.collection("categories");

  const categoryId = req.params.id;

  if (categoryId) {
    let category = await categoryCollection.findOne({
      _id: new ObjectId(categoryId),
    });

    if (category) {
      try {
        await categoryCollection.deleteOne({
          _id: new ObjectId(categoryId),
        });
        res.status(200).send("deleted successfully");
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(401).send("category not found");
    }
  } else {
    res.status(404).send("no a proper url");
  }
});

export default categoryRouter;
