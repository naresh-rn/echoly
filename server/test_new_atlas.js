const mongoose = require('mongoose');
const uri = "mongodb://nareshrnh3:naresh2003@ac-ibftecl-shard-00-00.p7dtia2.mongodb.net:27017,ac-ibftecl-shard-00-01.p7dtia2.mongodb.net:27017,ac-ibftecl-shard-00-02.p7dtia2.mongodb.net:27017/?ssl=true&replicaSet=atlas-11fw64-shard-0&authSource=admin&appName=Cluster0";

console.log("Testing new Atlas connection...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to new Atlas URI!");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAILURE: Could not connect to new Atlas URI.");
    console.error(err.message);
    process.exit(1);
  });
