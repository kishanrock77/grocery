const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ✅ Detect environment
const isLocal = process.env.NODE_ENV === 'local';

// ✅ S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// ✅ Ensure uploads folder exists (for local)
if (isLocal) {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
}

// ✅ Multer Storage (dynamic)
const storage = isLocal
  ? multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${Math.random()}-${file.originalname}`;
        cb(null, uniqueName);
      }
    })
  : multer.memoryStorage();

// ✅ Multer config
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 🔥 Upload function (smart)
const uploadFile = async (file) => {
  if (isLocal) {
    // ✅ Local URL
    return `http://localhost:${process.env.PORT}/uploads/${file.filename}`;
  } else {
    // ✅ S3 upload
    const fileName = `uploads/${Date.now()}-${Math.random()}-${file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  }
};

// ✅ Single Image
const uploadSingleImage = (fieldName) => [
  upload.single(fieldName),

  async (req, res, next) => {
    try {
      if (req.file) {
        const url = await uploadFile(req.file);
        req.body.imagepath = url;
      }
      next();
    } catch (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({
        success: false,
        message: "Image upload failed"
      });
    }
  }
];

// ✅ Multiple Images
const uploadMultipleImages = (fieldName, maxCount = 5) => [
  upload.array(fieldName, maxCount),

  async (req, res, next) => {
    try {
      if (req.files && req.files.length > 0) {
        const urls = [];

        for (let file of req.files) {
          const url = await uploadFile(file);
          urls.push(url);
        }

        req.body.images = urls;
      }
      next();
    } catch (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({
        success: false,
        message: "Images upload failed"
      });
    }
  }
];

module.exports = {
  uploadSingleImage,
  uploadMultipleImages
};