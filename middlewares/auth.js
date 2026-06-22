import jwt from "jsonwebtoken";

async function auth(req, res, next) {
  await req.db.createCollection("users");
  let usersCollection = req.db.collection("users");
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).send("unauthorized to this action");
    return;
  }

  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await usersCollection.findOne({ email: decoded.email });

  if (!user) {
    res.status(401).send("unauthorized to do this action");
    return;
  }

  if (user.admin == true || user.canEdit == true) {
    next();
  } else {
    res.status(401).send("unauthorized");
  }
}

export default auth;
