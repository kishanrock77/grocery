const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

require("./cron/orderTimeoutCheck");

const { initSocket } = require("./socket");

const corsOptions = {
  origin: [
    "https://app.fastbite.food",
    "http://localhost:4200", "http://localhost:4100"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("/*", cors(corsOptions));
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
 app.use("/api/customer", require("./routes/customer"));
   
app.use("/uploads", express.static("uploads"));



/* SOCKET INIT */

initSocket(server);



/* SERVER START */

server.listen(process.env.PORT, () => {

  console.log("Server running on port  " + process.env.PORT);

});