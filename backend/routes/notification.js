const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");



/*
----------------------------------
USER NOTIFICATION LIST
----------------------------------
*/

router.get("/list/:userId", async (req, res) => {

  try {

    const list = await Notification.find({

      userId: req.params.userId,
      status: true

    }).sort({ createdAt: -1 });

    res.json(list);

  } catch (err) {

    res.status(500).send(err);

  }

});

router.get("/completelist", async (req, res) => {

  try {

    const list = await Notification.find({
 
      status: true

    }).sort({ createdAt: -1 });

    res.json(list);

  } catch (err) {

    res.status(500).send(err);

  }

});


/*
----------------------------------
MARK AS READ
----------------------------------
*/

router.put("/read/:id", async (req, res) => {

  try {

    await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true }
    );

    res.json({ msg: "Notification read" });

  } catch (err) {

    res.status(500).send(err);

  }

});

 


module.exports = router;