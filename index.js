const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to personal service server");
});
//addmin111
//${process.env.DB_USER}:${process.env.DB_PASSWORD}
//DBUizJeBKY6uwQ0l

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fm710lc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tmuuwhy.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verfy Json Web token
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECREET, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    // set decoded
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    const serviceCollection = client
      .db("PersonalService")
      .collection("services");
    const reviewCollection = client.db("PersonalService").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECREET, {
        expiresIn: "22h",
      });
      res.send({ token });
      console.log(token);
    });

    app.get("/hservices", async (req, res) => {
      const services = await serviceCollection
        .find({})
        .sort({ _id: -1 })
        .limit(3)
        .toArray();
      res.send(services);
    });
    app.get("/services", async (req, res) => {
      const services = await serviceCollection.find({}).toArray();
      res.send(services);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }; // full object take pabo
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.post("/addReview", async (req, res) => {
      const post = req.body;
      const result = await reviewCollection.insertOne(post);
      res.send(result);
      console.log(result);
    });

    app.get("/displayReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id }; // eita objectId te convert korar lgbena karon hochhe, eikhane objectId diye save ny

      const reviews = await reviewCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      console.log(reviews);
      res.send(reviews);
    });

    app.get("/myReviews", verifyJwt, async (req, res) => {
      // get decode from req.decoded
      const decoded = req.decoded;
      if (decoded.email !== req.query.userEmail) {
        res.status(403).send({ message: "unauthorized access" });
      }
      console.log(decoded.email, req.query.userEmail);

      let query = {};
      if (req.query.userEmail) {
        query = {
          userEmail: req.query.userEmail,
        };
      }
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
      // console.log(result, req.query.userEmail);
    });

    app.delete("/myReviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });

    app.post("/addService", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.patch("/myReviews/:id", async (req, res) => {
      const id = req.params.id;
      const textArea = req.body.review;
      const query = { _id: ObjectId(id) };
      console.log(textArea, query);
      const updateReview = {
        $set: {
          textArea: textArea,
        },
      };
      const result = await reviewCollection.updateOne(query, updateReview);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`personal Service Servier Is running port ${port} ${port}`);
});
