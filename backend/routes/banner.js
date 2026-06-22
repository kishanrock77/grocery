const express = require("express");
const router = express.Router();


const Banner = require("../models/Banner");

const {
  uploadSingleImage
} = require("../middleware/uploadAWSS3");


const {
  DeleteObjectCommand,
  S3Client
} = require("@aws-sdk/client-s3");

//const sharp = require("sharp");





// S3 client

const s3 = new S3Client({

  region: process.env.AWS_REGION,

  credentials: {

    accessKeyId:
      process.env.AWS_ACCESS_KEY,

    secretAccessKey:
      process.env.AWS_SECRET_KEY

  }

});





// delete s3

const deleteFromS3 = async (url) => {


  try {


    if (!url)
      return;


    let key =
      url.split(".amazonaws.com/")[1];



    await s3.send(

      new DeleteObjectCommand({

        Bucket:
          process.env.AWS_BUCKET,

        Key: key

      })

    );



  }

  catch (err) {

    console.log(
      "S3 delete error",
      err
    );

  }


};










// ==========================
// ADD BANNER
// ==========================


router.post(

  "/addbanner",

  uploadSingleImage("image"),


  async (req, res) => {


    try {


      const {

        adminId,

        url

      } = req.body;



      if (!req.body.imagepath) {


        return res.json({

          success: false,

          message: "Image required"

        });


      }




      // dimension validation

      // let metadata =
      //   await sharp(req.file.buffer)
      //     .metadata();



      // if (

      //   metadata.width !== 270 ||

      //   metadata.height !== 133

      // ) {



      //   // delete uploaded wrong image

      //   await deleteFromS3(
      //     req.body.imagepath
      //   );



      //   return res.json({

      //     success: false,

      //     message:
      //       "Image must be 270x133"

      //   });


      // }




      let banner =

        await Banner.create({


          adminId,


          image:
            req.body.imagepath,


          url: url || ""


        });




      res.json({

        success: true,

        data: banner


      });



    }

    catch (e) {


      res.status(500).json({

        success: false,

        message: e.message

      });


    }


  }

);









// ==========================
// LIST
// ==========================


router.post(

  "/getListbanner",

  async (req, res) => {


    try {


      let data =

        await Banner.find({

          adminId: req.body.adminId

        })

          .sort({

            createdAt: -1

          });



      res.json({

        success: true,

        data

      });



    }

    catch (e) {

      res.status(500).json({

        success: false,

        message: e.message

      });

    }


  }

);









// ==========================
// DELETE HARD
// ==========================


router.get(

  "/deletebanner/:id",

  async (req, res) => {


    try {


      let banner =

        await Banner.findById(
          req.params.id
        );



      if (!banner) {


        return res.json({

          success: false,

          message: "Not found"

        });


      }



      // delete s3

      await deleteFromS3(
        banner.image
      );




      // hard delete mongodb

      await Banner.findByIdAndDelete(
        req.params.id
      );



      res.json({

        success: true,

        message: "Deleted"

      });


    }


    catch (e) {


      res.status(500).json({

        success: false,

        message: e.message

      });


    }



  }

);





module.exports = router;