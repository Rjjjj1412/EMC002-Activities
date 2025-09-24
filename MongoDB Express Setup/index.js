import express from "express";
import dotenv from "dotenv";
import mongodb from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json()); //middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //middleware to parse URL-encoded bodies

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/newendpoint", (req, res) => {
  res.send("Hello New Endpoint!");
});

app.get("/users", (req, res) => {
  const MongoClient = mongodb.MongoClient;
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;
  MongoClient.connect(uri)
    .then((client) => {
      const db = client.db(dbName);
      db.collection("users")
        .find()
        .toArray()
        .then((users) => {
          res.json(users);
        })
        .catch((err) => {
          console.error("Error fetching users:", err);
          res.status(500).send("Error fetching users");
        });
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).send("Error connecting to database");
    });
});

app.post("/users", (req, res) => {
  const { name, age, address } = req.body;
  const MongoClient = mongodb.MongoClient;
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;
  MongoClient.connect(uri)
    .then((client) => {
      const db = client.db(dbName);
      db.collection("users")
        .insertOne({ name, age, address, createdAt: new Date() })
        .then((result) => {
          res.status(201).send("User added");
        })
        .catch((err) => {
          console.error("Error adding user:", err);
          res.status(500).send("Error adding user");
        });
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).send("Error connecting to database");
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
