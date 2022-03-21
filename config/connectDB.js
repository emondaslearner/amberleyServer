const mongoose = require("mongoose");
const connectDB = () => {
  mongoose
    .connect(process.env.URI)
    .then((data) => {
      console.log("Database Connection established", data.connection.host);
    })
    .catch((err) => {
      console.error(err.message);
    });
};
module.exports = connectDB;
