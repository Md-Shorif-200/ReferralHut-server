// server.js
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("myDatabase");
    const petsCollection = db.collection("pets");

    // Routes
    app.get("/", (req, res) => {
      res.send("Hello from Node.js + Express + MongoDB Server 🚀");
    });

    // Example: Get all pets
    app.get("/pets", async (req, res) => {
      const pets = await petsCollection.find().toArray();
      res.json(pets);
    });

    // Example: Add new pet
    app.post("/add-pet", async (req, res) => {
      const pet = req.body;
      const result = await petsCollection.insertOne(pet);
      res.json(result);
    });
  } catch (err) {
    console.error(err);
  }
}
run().catch(console.dir);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
