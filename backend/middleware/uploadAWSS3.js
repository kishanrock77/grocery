const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ✅ S3 Client (v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// ✅ Multer Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 🔥 COMMON FUNCTION (Reusable)
const uploadToS3 = async (file) => {
  
const fileName = `uploads/${Date.now()}-${Math.random()}-${file.originalname}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};
 
const uploadSingleImage = (fieldName) => [
  upload.single(fieldName),

  async (req, res, next) => {
    try {
      if (req.file) {
        const url = await uploadToS3(req.file);
        req.body.imagepath = url;
      }
      next();
    } catch (err) {
      console.error("S3 Upload Error:", err);
      return res.status(500).json({
        success: false,
        message: "Image upload failed"
      });
    }
  }
];
 
const uploadMultipleImages = (fieldName, maxCount = 5) => [
  upload.array(fieldName, maxCount),

  async (req, res, next) => {
    try {
      if (req.files && req.files.length > 0) {
        const urls = [];

        for (let file of req.files) {
          const url = await uploadToS3(file);
          urls.push(url);
        }

        req.body.images = urls;
      }
      next();
    } catch (err) {
      console.error("S3 Upload Error:", err);
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
