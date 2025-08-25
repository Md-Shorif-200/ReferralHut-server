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
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.56yvv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // ! database collections
    const db = client.db("ReferralHut-Db");

    const usersCollection = db.collection("users");

    // ! Unique ID Generator Function

    const generateUniqueId = async () => {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
     const uniqueId = Math.floor(100000 + Math.random() * 900000);


        const existingUser = await usersCollection.findOne({
          uniqueId: uniqueId,
        });

        if (!existingUser) {
          return uniqueId;
        }
        attempts++;
      }

      throw new Error("Could not generate unique ID after maximum attempts");
    };

    //! ------------------- user related api

    app.post("/api/referral-creat-users", async (req, res) => {
      const userData = req.body;

      // genarate unique id
      const uniqueId = await generateUniqueId();

      // userData তে uniqueId যোগ করুন
      userData.uniqueId = uniqueId;

      const result = await usersCollection.insertOne(userData);
      res.send(result);
    });

    app.get("/api/referral-get-users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("server is running");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
