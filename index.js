import express from "express"; // express app
import cors from "cors"; // cors
import { MongoClient, ServerApiVersion } from "mongodb"; // clinet mongodb
import authRouter from "./routes/auth.js"; // our auth router
import dns from "node:dns/promises";

const app = express(); // express app
const port = 3000; // local host port
const MONGODB_CONNECTION_URL =
  "mongodb+srv://anshvishesh03_db_user:aUmYMY4JJvfVm1Sm@cluster0.uupfiwj.mongodb.net/?appName=Cluster0";

app.use(express.json()); // parse json
app.use(cors()); // cors

// setting dns
dns.setServers(["1.1.1.1"]);
console.log(await dns.getServers()); // 127.0.0.1

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(MONGODB_CONNECTION_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect the client to the server	(optional starting in v4.7)
try {
  await client.connect(); // conecting
  let db = client.db("look-zone"); // Send a ping to confirm a successful connection

  // Custom middleware to pass db instance to every route
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  console.log("Pinged your deployment. You successfully connected to MongoDB!");
} catch (err) {
  console.log(err);
}

// routes
app.use("/auth", authRouter);

app.get("/", async (req, res, next) => {
  try {
    res.send("success").status(200);
  } catch (err) {
    res.send(err.message).status(500);
  } finally {
    next();
  }
});

app.listen(port, () => {
  console.log(`app is running on ${port}`);
}); // listening on the port
