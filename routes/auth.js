import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import generateId from "../generateId.js";

const authRouter = express.Router(); // auth router

// auth user with token
authRouter.get("/", async function (req, res, next) {
  await req.db.createCollection("users");
  let token = req.body.token;
  if (token === "" || token == undefined || token == null) {
    res.status(404).send("token missing");
    return;
  }

  let decoded = jwt.verify(token, process.env.JWT_SECRET);

  let usersCollection = req.db.collection("users");
  let user = await usersCollection.findOne({ email: decoded.email });

  if (user) {
    res.status(200).send(user);
    next();
  } else {
    res.status(404).send("user not found");
    next();
  }
});

// login user
authRouter.post("/login", async function (req, res, next) {
  await req.db.createCollection("users");
  let password = req.body.password;
  let email = req.body.email;

  if (
    password === "" ||
    password == undefined ||
    password == null ||
    email === "" ||
    email == undefined ||
    email == null
  ) {
    res.status(404).send("please fill the required fields");
    return;
  }

  let usersCollection = req.db.collection("users");
  let user = await usersCollection.findOne({ email: email });

  if (user) {
    let isMatched = await bcrypt.compare(password, user.password);

    if (isMatched !== true) {
      res.status(401).send("password doesn't match");
      return;
    }

    let token = jwt.sign({ email: email }, process.env.JWT_SECRET);

    res.status(200).send(token);
  } else {
    res.status(404).send("no user found with this email");
    return;
  }
});

// sign up user
authRouter.post("/signup", async function (req, res, next) {
  await req.db.createCollection("users");
  let password = req.body.password;
  let email = req.body.email;
  let name = req.body.name;

  if (
    password === "" ||
    password == undefined ||
    password == null ||
    email === "" ||
    email == undefined ||
    email == null ||
    name === "" ||
    name == undefined ||
    name == null
  ) {
    res.status(404).send("please fill the required fields");
    return;
  }

  let usersCollection = req.db.collection("users");
  let user = await usersCollection.findOne({ email: email });

  if (user) {
    res.status(401).send("user found with this email... login");
    next();
  } else {
    let hashedPassword = await bcrypt.hash(password, 10);
    try {
      let newUser = await usersCollection.insertOne({
        name: name,
        email: email,
        password: hashedPassword,
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          zip: "",
          addressMade: false,
        },
        cart: { products: [], totalPrice: 0, id: generateId(8) },
        orders: [],
      });

      let token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET);
      res.status(200).send(token);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
});

// get user by id
authRouter.get("/user/:id", async (req, res, next) => {
  const userId = req.params.id;
  await req.db.createCollection("users");

  if (userId === "" || userId == null || userId == undefined) {
    res.status(500).send("bad request");
    return;
  }

  let userCollection = req.db.collection("users");
  let user = await userCollection.findOne({ _id: new ObjectId(userId) });

  if (user) {
    res.status(200).send(user);
  } else {
    res.status(404).send("user not found");
  }
});

authRouter.put("/update/:id", async (req, res, next) => {
  const userId = req.params.id;
  await req.db.createCollection("users");

  if (userId === "" || userId == null || userId == undefined) {
    res.status(500).send("bad request");
    return;
  }

  let userCollection = req.db.collection("users");
  let user = await userCollection.findOne({ _id: new ObjectId(userId) });

  if (user) {
    let street = req.body.street;
    let city = req.body.city;
    let state = req.body.state;
    let zip = req.body.zip;
    let country = req.body.country;

    if (street && city && zip && state && country) {
      let newAddress = {
        state: state,
        city: city,
        street: street,
        zip: zip,
        country: country,
        addressMade: true,
      };

      try {
        await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { address: newAddress } },
        );
        res.status(200).send("address updated successfully");
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(401).send("please fill the fields");
      return;
    }
  } else {
    res.status(404).send("user not found");
  }
});

export default authRouter;
