const multer = require("multer");

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "uploads/category/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  }

});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = upload;