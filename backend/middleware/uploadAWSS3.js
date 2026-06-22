const multer = require("multer");
const fs = require("fs");
const path = require("path");

const {
  S3Client,
  PutObjectCommand
} = require("@aws-sdk/client-s3");


// environment

const isLocal = process.env.NODE_ENV === "local";



// S3 Client

const s3 = new S3Client({

  region: process.env.AWS_REGION,

  credentials: {

    accessKeyId:
      process.env.AWS_ACCESS_KEY,

    secretAccessKey:
      process.env.AWS_SECRET_KEY

  }

});




// local folder

if (isLocal) {

  const uploadDir =
    path.join(__dirname, "../uploads");


  if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(uploadDir);

  }

}



// storage


const storage = isLocal

  ?
  multer.diskStorage({

    destination: (req, file, cb) => {

      cb(null, "uploads/");

    },


    filename: (req, file, cb) => {

      const name =
        Date.now() + "-" + file.originalname;


      cb(null, name);

    }


  })

  :

  multer.memoryStorage();





const upload = multer({

  storage,


  limits: {

    fileSize:
      10 * 1024 * 1024

  }


});







// upload to s3


const uploadFile = async (file) => {


  if (isLocal) {


    return `http://localhost:${process.env.PORT}/uploads/${file.filename}`;


  }





  const fileName =

    `custom-order/${Date.now()}-${Math.random()}-${file.originalname}`;





  await s3.send(


    new PutObjectCommand({

      Bucket:
        process.env.AWS_BUCKET,


      Key: fileName,


      Body: file.buffer,


      ContentType: file.mimetype


    })


  );




  return (

    `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`

  );



};









// Single Image

const uploadSingleImage = (fieldName) => [


  upload.single(fieldName),



  async (req, res, next) => {


    try {


      if (req.file) {


        req.body.imagepath =

          await uploadFile(req.file);


      }



      next();



    }

    catch (err) {


      console.log(err);


      res.status(500).json({

        success: false,

        message: "Upload failed"

      });


    }


  }


];











// Multiple Images


const uploadMultipleImages = (

  fieldName,

  maxCount = 5

) => [



    upload.array(fieldName, maxCount),




    async (req, res, next) => {


      try {


        let urls = [];



        if (req.files) {



          for (let file of req.files) {


            let url =
              await uploadFile(file);


            urls.push(url);



          }



        }



        req.body.images = urls;



        next();



      }

      catch (err) {


        console.log(err);


        res.status(500).json({

          success: false,

          message: "Images upload failed"

        });


      }


    }



  ];












// Multiple Fields

// images + pdf

const uploadMultipleFields = (fields) => [



  upload.fields(fields),




  async (req, res, next) => {


    try {



      // images


      if (req.files?.images) {


        let images = [];



        for (let file of req.files.images) {



          let url =
            await uploadFile(file);



          images.push(url);


        }



        req.body.images = images;


      }






      // pdf


      if (req.files?.pdf) {



        req.body.pdf =

          await uploadFile(
            req.files.pdf[0]
          );



      }




      next();



    }

    catch (err) {


      console.log(err);



      res.status(500).json({

        success: false,

        message: "File upload failed"

      });


    }



  }


];








module.exports = {


  uploadSingleImage,


  uploadMultipleImages,


  uploadMultipleFields


};