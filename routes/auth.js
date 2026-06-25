import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import generateId from "../generateId.js";
import auth from "../middlewares/auth.js";
import login from "../middlewares/login.js";
import adminView from "../middlewares/adminView.js";

const authRouter = express.Router(); // auth router

// auth user with token
authRouter.get("/", async function (req, res, next) {
  await req.db.createCollection("users");
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).send("unauthorized to this action");
    return;
  }

  let decoded = jwt.verify(token, process.env.JWT_SECRET);

  let usersCollection = req.db.collection("users");
  let user = await usersCollection.findOne({ email: decoded.email });

  if (user) {
    res.status(200).send(user);
  } else {
    res.status(404).send("user not found");
  }
});

// login user
authRouter.post("/login", async function (req, res, next) {
  await req.db.createCollection("users");
  console.log(typeof req.body);
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

    let token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

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
        admin: email === "anshvishesh03@gmail.com" ? true : false,
        canEdit: email === "anshvishesh03@gmail.com" ? true : false,
        canView: email === "anshvishesh03@gmail.com" ? true : false,
        cart: { products: [], totalPrice: 0, id: generateId(8) },
        orders: [],
      });

      let token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
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

authRouter.put("/update/:id", login, async (req, res, next) => {
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

authRouter.put("/dashboard/:id", auth, async (req, res, next) => {
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  let id = req.params.id;
  let mode = req.body.mode;
  if (mode && id) {
    let user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      res.status(404).send("user not found");
      return;
    }

    if (mode === "edit-to-view") {
      await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            canEdit: false,
            canView: true,
          },
        },
      );

      res.status(200).send("permission updated");
    } else if (mode === "view-to-edit") {
      await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            canEdit: true,
            canView: true,
          },
        },
      );

      res.status(200).send("permission updated");
    } else if (mode === "edit-to-none" || mode === "view-to-none") {
      await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            canEdit: false,
            canView: false,
          },
        },
      );

      res.status(200).send("permission updated");
    } else {
      res.status(401).send("user send different mode");
    }
  } else {
    res.status(404).send("user didn't send the mode or didn't send the id");
  }
});

authRouter.get("/search", adminView, async (req, res, next) => {
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  let search = req.query.search;

  usersCollection.createIndex({ name: "text" });

  if (!search) {
    res.status(404).send("wrong url");
    return;
  }

  let usersCursor = usersCollection.find({ $text: { $search: search } });
  let users = [];
  for await (let newUser of usersCursor) {
    users.push(newUser);
  }

  res.status(200).send(users);
});

authRouter.get("/users", adminView, async (req, res, next) => {
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");

  let usersCursor = usersCollection.find({});
  let users = [];
  for await (let newUser of usersCursor) {
    users.push(newUser);
  }

  res.status(200).send(users);
});

export default authRouter;
