const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const uri = "mongodb+srv://database:database@cluster0.9pksi.mongodb.net/amberley?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const connectClient = async () => {
  try {
    await client.connect();
    const invoice = client.db("amberley").collection("Invoice_Information");

   app.post('/', async(req, res) => {
     const result = await invoice.insertOne(req.body);
     res.send(result)
   })

  } catch(err) {
    console.log("Something Went Wrong!!", err.message);
  }
};
connectClient();

app.listen(4000, () => {
  console.log("localhost running");
});
