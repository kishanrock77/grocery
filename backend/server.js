const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

require("./cron/orderTimeoutCheck");

const { initSocket } = require("./socket");

app.use(cors());
app.use(express.json());


/// for atlas
//mongodb+srv://kishan:111111111@cluster0-t6mie.mongodb.net/edutech?retryWrites=true&w=majority
//mongodb+srv://xcellinsprocare:111111111@cluster0.i0xczes.mongodb.net/edutech?retryWrites=true&w=majority
mongoose.connect(process.env.MONGO_URL);

//mongoose.connect(process.env.MONGO_URL, { useUnifiedTopology: true, useNewUrlParser: true });
mongoose.connection.on('connected', () => {
  //console.log('connected to db');
});

mongoose.connection.on('error', (err) => {

  if (err) {
    //console.log('Error in db connection ' + err);
  }

});
/// for atla end

/* ROUTES */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/store", require("./routes/store"));
app.use("/api/order", require("./routes/order"));
app.use("/api/notification", require("./routes/notification"));
app.use("/api/deliveryboy", require("./routes/deliveryboy"));
app.use("/api/delivery-area", require("./routes/deliveryArea"));
app.use("/api/store-owner", require("./routes/storeOwner"));
 app.use("/api/category", require("./routes/category"));
  app.use("/api/item", require("./routes/item"));

app.use("/uploads", express.static("uploads"));



/* SOCKET INIT */

initSocket(server);



/* SERVER START */

server.listen(3001, () => {

  console.log("Server running on port 3001");

});