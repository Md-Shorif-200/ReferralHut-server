// server.js
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ------------------- Middleware -------------------
app.use(cors());
app.use(express.json());

// ------------------- MongoDB Connection -------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.56yvv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// ------------------- Main Function -------------------
async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // !  database collection
    const db = client.db("ReferralHut-Db");

    const usersCollection = db.collection("users");
    const depositCollection = db.collection("all-deposit");
    const paymentCollection = db.collection("all-payment");

    // Create a unique index for uniqueId to prevent duplicates
    await usersCollection.createIndex({ uniqueId: 1 }, { unique: true });

    // ------------------- Unique ID Generator -------------------
    const generateUniqueId = async () => {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const uniqueId = Math.floor(100000 + Math.random() * 900000);

        const existingUser = await usersCollection.findOne({ uniqueId });
        if (!existingUser) return uniqueId;

        attempts++;
      }
      throw new Error("Could not generate unique ID after maximum attempts");
    };

    // ------------------- APIs -------------------

    // Create a new user
    app.post("/api/referral-creat-user", async (req, res) => {
      try {
        const userData = req.body;

        // Step 0: Check if email already exists
        const existingUser = await usersCollection.findOne({
          email: userData.email,
        });
        if (existingUser) {
          return res.status(400).send({
            success: false,
            message: "This email is already registered",
          });
        }

        // Step 1: Generate a unique ID for the new user
        const uniqueId = await generateUniqueId();
        userData.uniqueId = uniqueId;

        // Step 2: If referredBy exists, validate it
        if (userData.referredBy) {
          const referrer = await usersCollection.findOne({
            uniqueId: userData.referredBy,
          });
          if (!referrer) {
            return res.status(400).send({
              success: false,
              message: "Invalid referral ID",
            });
          }

          // Update referrer's myReferrals array
          await usersCollection.updateOne(
            { uniqueId: userData.referredBy },
            { $push: { myReferrals: userData.uniqueId } }
          );
        }

        // Step 3: Save the new user
        const result = await usersCollection.insertOne(userData);

        res.status(201).send({
          success: true,
          message: "User created successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to create user",
          error: error.message,
        });
      }
    });

    // Get all users
    app.get("/api/referral-get-users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.status(200).send({
          success: true,
          data: users,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    });

// ------------------------get user----------------------------
app.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;

    // Find the user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return only the user
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

    // --------------- deposite ---------------

    // post deposite data

   app.post("/api/post-deposite", async (req, res) => {
        const data = req.body;

        const result = await depositCollection.insertOne(data);
        res.send(result)
   })


      app.get("/api/find-deposite", async (req, res) => {

        const result = await depositCollection.find().toArray();
        res.send(result)
   })


   // PATCH /api/update-deposite-status
 
app.patch("/api/accept-deposite-status/:id", async (req, res) => {
  const id = req.params.id;
 

  const query = {_id : new ObjectId(id)};
 
        const updatedDoc = {
           $set : {
               status : 'accepted'
           }
        }
 
        const result = await depositCollection.updateOne(query,updatedDoc);
        res.send(result)

 
});




 
app.patch("/api/cancel-deposite-status/:id", async (req, res) => {
  const id = req.params.id;
 

  const query = {_id : new ObjectId(id)};
 
        const updatedDoc = {
           $set : {
               status : 'cancelled'
           }
        }
 
        const result = await depositCollection.updateOne(query,updatedDoc);
        res.send(result)

 
});



// ! payment  api

app.post("/api/payment", async (req, res) => {
        const data = req.body;
   
        const result = await paymentCollection.insertOne(data);
        res.send(result)
   })


      app.get("/api/payment", async (req, res) => {

        const result = await paymentCollection.find().toArray();
        res.send(result)
   })
   
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await paymentCollection.find().toArray();
    res.status(200).send({
      success: true,
       payments,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
});

   




    // Ping confirmation
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB deployment successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

// ------------------- Root Endpoint -------------------
app.get("/", (req, res) => {
  res.send("ReferralHut server is running...");
});

// ------------------- Start Server -------------------
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
