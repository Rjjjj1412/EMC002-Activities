import express from "express";
import dotenv from "dotenv";
import mongodb from "mongodb";
import jwt from "jsonwebtoken";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//cors to connect port/server in frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: false,
    allowedHeaders: "*",
    methods: "*",
  })
); //Adjust the origin as needed

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new mongodb.MongoClient(process.env.MONGODB_URI);
const dbName = process.env.MONGODB_NAME || "retail-store";
const db = client.db(dbName);
const customerCollection = db.collection("customers");

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("connected to MongoDB");
  } catch (error) {
    console.error("failed to connect to database ", error);
  }
}

const authenticateToken = (rq, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  //authHeader = "Bearer <tokenvalue>"

  if (!token) {
    return res.status(401).json({ error: "Access Token Required" });
  }

  // node -e "console.log(require('node:crypto').randomBytes(8).toString('hex'))"
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
};

//Routes Here

//GET
app.get("/customers", async (req, res) => {
  try {
    const { username, email } = req.query;
    let filter = {};

    if (username) filter.username = username;
    if (email) filter.email = email;

    const customers = await customerCollection.find(filter).toArray();

    res
      .status(200)
      .json({ data: customers, message: "Customers Retrieved Successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error: ", error: error.message });
  }
});

//POST
app.post("/customers", async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone, address } =
      req.body; //json

    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        message: "Missing required values.",
        fields: { username, email, password, first_name, last_name },
      });
    }

    const newCustomer = { ...req.body, created_at: new Date() }; //spreading
    const result = await customerCollection.insertOne(newCustomer);

    res.status(201).json({
      data: result,

      message: "Customer created successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error: ", error: error.message });
  }
});

//PUT
app.put("/customers/:id", async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone, address } =
      req.body; //json

    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        message: "Missing required values.",
        fields: { username, email, password, first_name, last_name },
      });
    }

    const customerId = new mongodb.ObjectId(req.params.id);
    const updatedCustomer = { ...req.body, updated_at: new Date() }; //spreading
    const result = await customerCollection.updateOne(
      { _id: customerId },
      { $set: updatedCustomer }
    );

    res.status(200).json({
      data: result,
      message: "Customer updated successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error: ", error: error.message });
  }
});

//DELETE
app.delete("/customers/:id", async (req, res) => {
  try {
    const customerId = new mongodb.ObjectId(req.params.id);

    const result = await customerCollection.deleteOne({ _id: customerId });

    res.status(200).json({
      data: result,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error.", error: error.message });
  }
});

app.post("/generateToken", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).json({ token });
});

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
