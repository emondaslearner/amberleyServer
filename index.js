const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const connectDB = require("./config/connectDB");
const crypto = require("crypto");
const sendOTP = require("./otp");
const fs = require("fs-extra");

connectDB();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(fileUpload());
function randomOTP() {
  const keyword = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomKey = "";
  for (let i = 0; i < 6; i++)
    randomKey += keyword.charAt(Math.floor(Math.random() * keyword.length));

  return randomKey;
}

async function hash(key) {
  return new Promise((resolve, reject) => {
    // generate random 16 bytes long salt
    const salt = crypto.randomBytes(16).toString("hex");

    crypto.scrypt(key, salt, 16, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

async function verify(password, hash) {
  console.log(password, hash);
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 16, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key == derivedKey.toString("hex"));
    });
  });
}

// Model

const otpModel = mongoose.model("otpModels", {
  email: {
    type: String,
    unique: true,
    required: [true, "Please Enter Your Email"],
  },
  OTP: {
    type: String,
    required: [true, "Please Enter Your Email"],
  },
});

const invoiceModel = mongoose.model("Invoice_Information", {
  name: String,
  email: String,
  invoiceNumbers: String,
  purchaseNos: String,
  dueDate: Date,
  issuedDates: Date,
  chrisDare: String,
  grandTotal: Number,
  description: String,
  item: Array,
  pdf: { pdf: Buffer, contentType: String },
});



app.get("/", (req, res) => {
  res.send("You are doing well");
});

app.post("/", async (req, res) => {
  res.status(200).json({ sucess: true, message: "Ei Duniar Kew vala na!!" });
  //get data and parse item from req.body
  const item = JSON.parse(req.body.item);
  const invoiceData = {
    invoiceNumbers: req.body.invoiceNumbers,
    chrisDare: req.body.chrisDare,
    name: req.body.name,
    email: req.body.email,
    dueDate: req.body.dueDate,
    purchaseNos: req.body.purchaseNos,
    issuedDates: req.body.issuedDates,
    item,
    grandTotal: req.body.grandTotal,
    description: req.body.description,
  };
  

  if (req.files == null) {
    //without file save data
    const data = await invoiceModel(invoiceData);
    const dataSave = await data.save();
    res.send(dataSave);
  }else{
    //with file save data
    const file = req.files.file;
    const filePath = `${__dirname}/files/${file.name}`;
    file.mv(filePath,err => {
      if(err){
        res.send(err)
      }
      const image = fs.readFileSync(filePath)
      const encImg = image.toString('base64')
      const pdf = {
        contentType:file.mimetype,
        pdf:Buffer.from(encImg,'base64')
      }
      const invoiceDataWithFile = {
        invoiceNumbers: req.body.invoiceNumbers,
        chrisDare: req.body.chrisDare,
        name: req.body.name,
        email: req.body.email,
        dueDate: req.body.dueDate,
        purchaseNos: req.body.purchaseNos,
        issuedDates: req.body.issuedDates,
        item,
        grandTotal: req.body.grandTotal,
        description: req.body.description,
        pdf
      };
      const data = invoiceModel(invoiceDataWithFile);

      //save data to database
      const dataSave = data.save();
      dataSave
      .then(result => {
        fs.remove(filePath,err => {
          console.log(err)
        })
        res.send(dataSave)
      })
    })
  }
});

app.get("/createOtp/:email", async (req, res) => {
  try {
    const key = randomOTP();
    const hashedKey = await hash(key);
    const messageId = await sendOTP(req.params.email, key);
    if (messageId && hashedKey) {
      const data = await otpModel.findOneAndUpdate(
        { email: req.params.email },
        {
          email: req.params.email,
          OTP: hashedKey,
        },
        {
          new: true,
          upsert: true,
        }
      );
      if (data) {
        return res
          .status(200)
          .json({ success: true, message: "Please check email", data });
      } else {
        return res
          .status(200)
          .json({ success: true, message: "Please Try Again", data });
      }
    } else {
      res.status(404).json({ success: false, message: "Try again" });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/validateOTP/:OTP/:email", async (req, res) => {
  // console.log(req.headers.cookie, 'vairfdfjd');
  const validOTP = await otpModel.findOne({ email: req.params.email });
  if (!validOTP) {
    return res.status(200).json({
      success: false,
      message: "Email not found, Try again",
      validOTP,
    });
  }
  const data = await verify(req.params.OTP, validOTP?.OTP);
  if (!data) {
    return res
      .status(200)
      .json({ success: false, message: "OTP  didn't Matched" });
  }
  await otpModel.deleteOne({ _id: data._id });
  res.status(200).json({ success: true, message: "OTP Matched Successfully" });
});

app.listen(port, () => console.log("listening on port", port));
