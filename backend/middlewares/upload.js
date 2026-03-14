const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

  destination: function(req,file,cb){
    cb(null,"uploads/documents");
  },

  filename: function(req,file,cb){
    const unique = Date.now()+"-"+file.originalname;
    cb(null,unique);
  }

});

const upload = multer({ storage });

module.exports = upload;