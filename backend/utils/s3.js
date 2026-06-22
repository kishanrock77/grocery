const AWS = require("aws-sdk");


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});


exports.uploadFile = async (file) => {


  let params = {

    Bucket: process.env.AWS_BUCKET,

    Key:
      "banner/" + Date.now() + "-" + file.originalname,

    Body: file.buffer,

    ContentType: file.mimetype

  };


  let result =
    await s3.upload(params).promise();


  return result.Location;

}



exports.deleteFile = async (url) => {


  let key =
    url.split(".com/")[1];


  await s3.deleteObject({

    Bucket: process.env.AWS_BUCKET,

    Key: key

  }).promise();


}