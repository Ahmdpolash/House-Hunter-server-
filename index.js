const express = require("express");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin:
      "https://65b004de1f780d1d2feaf351--celebrated-pithivier-24b0e2.netlify.app",
    credentials: true,
  })
);
app.use(cookieParser());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yrssrk8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("HouseHunter").collection("users");
    const houseCollection = client.db("HouseHunter").collection("houses");

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.post("/login", async (req, res) => {
      try {
        const check = await userCollection.findOne({ email: req.body.email });
        if (!check) {
          res.send("user name not found");
        }
        const isPassword = await bcrypt.compare(
          req.body.password,
          check.password
        );
        console.log(check.password, req.body.password);
        console.log(isPassword);
        if (isPassword) {
          // res.send('home')
          const token = jwt.sign({ userId: check._id }, process.env.JWT_TOKEN, {
            expiresIn: "1h",
          });
          res
            .cookie("token", token, {
              httpOnly: true,
              secure: true,
              sameSite: "none",
            })
            .send({ success: true });
        } else {
          res.send({ message: "wrong pass" });
        }
      } catch {
        res.send("wrong ");
      }
    });

    app.post("/users", async (req, res) => {
      const data = req.body;

      const email = { email: data.email };
      const existingUser = await userCollection.findOne(email);
      if (existingUser) {
        return res.send({ message: " user already exists" });
      }
      const saltRound = 10;
      const hashPassword = await bcrypt.hash(data.password, saltRound);
      data.password = hashPassword;
      const result = await userCollection.insertOne(data);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/houses", async (req, res) => {
      const result = await houseCollection.find().toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("welcome to House Hunter");
});

app.listen(port, () => {
  console.log("server is running ");
});
