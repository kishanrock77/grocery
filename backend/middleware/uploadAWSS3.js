const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// ================= S3 =================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// ================= Multer Memory =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ================= Local Upload Dir =================
const LOCAL_DIR = path.join(__dirname, "../uploads");

if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

// ================= Helper: Upload =================
const uploadToStorage = async (file) => {
  const fileName = `uploads/${Date.now()}-${Math.random()}-${file.originalname}`;

  // 🔥 LOCAL MODE
  if (process.env.USE_S3 !== "true") {
    const localPath = path.join(LOCAL_DIR, path.basename(fileName));

    fs.writeFileSync(localPath, file.buffer);

    return `http://localhost:${process.env.PORT || 3000}/uploads/${path.basename(fileName)}`;
  }

  // 🔥 S3 MODE
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// ================= SINGLE =================
const uploadSingleImage = (fieldName) => [
  upload.single(fieldName),
  async (req, res, next) => {
    try {
      if (req.file) {
        const url = await uploadToStorage(req.file);
        req.body.imagepath = url;
      }
      next();
    } catch (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  },
];

// ================= MULTIPLE =================
const uploadMultipleImages = (fieldName, maxCount = 5) => [
  upload.array(fieldName, maxCount),
  async (req, res, next) => {
    try {
      if (req.files?.length) {
        const urls = [];

        for (let file of req.files) {
          const url = await uploadToStorage(file);
          urls.push(url);
        }

        req.body.images = urls;
      }
      next();
    } catch (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  },
];

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
};