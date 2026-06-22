import express from "express";
import { ObjectId } from "mongodb";
import cloudinary from "../cloudinary.js";
import upload from "../multer.js";

const productRouter = express.Router();

productRouter.get("/", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");

  let productsCursor = productsCollection.find({});
  let products = [];

  for await (let newProduct of productsCursor) {
    products.push(newProduct);
  }

  res.status(200).send(products);
});

productRouter.get("/category/:id", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");
  let id = req.params.id;

  if (id) {
    let productsCursor = productsCollection.find({
      categoryId: new ObjectId(id),
    });
    let products = [];

    for await (let newProduct of productsCursor) {
      products.push(newProduct);
    }

    res.status(200).send(products);
  } else {
    res.status(404).send("send right url");
  }
});

productRouter.get("/search", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");
}); // after conecting backend to frontend

productRouter.get("/product/:id", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");
  let productId = req.params.id;
  if (productId) {
    try {
      let product = await productsCollection.findOne({
        _id: new ObjectId(productId),
      });
      if (product) {
        res.status(200).send(product);
      } else {
        res.status(404).send("product not found");
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("bad url");
  }
});

productRouter.post("/add", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");

  let name = req.body.name;
  let description = req.body.description;
  let price = req.body.price;
  let stock = req.body.stock;
  let categoryId = req.body.categoryId;
  let images = req.body.images;

  if (name && description && price && stock && categoryId && images) {
    try {
      let newProduct = await productsCollection.insertOne({
        name: name,
        description: description,
        price: price,
        stock: stock,
        categoryId: new ObjectId(categoryId),
        images: images,
        stars: 0,
        reviews: [],
      });
      res.status(200).send("product added");
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("user did not send me data");
  }
});

productRouter.put("/update/:id", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");

  let name = req.body.name;
  let description = req.body.description;
  let price = req.body.price;
  let stock = req.body.stock;
  let categoryId = req.body.categoryId;
  let images = req.body.images;
  let productId = req.params.id;

  if (productId) {
    try {
      let product = await productsCollection.findOne({
        _id: new ObjectId(productId),
      });
      if (product) {
        await productsCollection.updateOne(
          { _id: new ObjectId(productId) },
          {
            $set: {
              name: name ? name : product.name,
              description: description ? description : product.description,
              price: price ? price : product.price,
              stock: stock ? stock : product.stock,
              categoryId: categoryId
                ? new ObjectId(categoryId)
                : new ObjectId(product.categoryId),
              images: images ? images : product.images,
            },
          },
        );
        res.status(200).send("updated succesfully");
      } else {
        res.status(404).send("product not found");
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("user did not send data or bad url");
  }
});

productRouter.delete("/delete/:id", async (req, res, next) => {
  await req.db.createCollection("products");
  let productsCollection = req.db.collection("products");

  let productId = req.params.id;

  if (productId) {
    try {
      await productsCollection.deleteOne({ _id: new ObjectId(productId) });
      res.status(200).send("delected succesfully");
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("bad url");
  }
});

productRouter.post(
  "/upload",
  upload.single("image"),
  async (req, res, next) => {
    let file = req.file;
    if (file) {
      // try {
      //   let url = await cloudinary.uploader.upload(file.path);

      //   res.status(200).send({ url: url.secure_url, id: url.public_id });
      // } catch (err) {
      //   res.status(500).send(err.message);
      // }

      let stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (err, result) => {
          if (err) {
            res.status(500).send(err.message);
            return;
          }

          res
            .status(200)
            .send({ url: result.secure_url, id: result.public_id });
        },
      );

      stream.end(file.buffer);
    } else {
      res.status(404).send("no file sended");
    }
  },
);

productRouter.delete("/destroy/:id", async (req, res, next) => {
  let id = req.params.id;
  if (id) {
    try {
      let url = await cloudinary.uploader.destroy(id);

      res.status(200).send("image delected succesfully");
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.status(404).send("wrong url");
  }
});

export default productRouter;
