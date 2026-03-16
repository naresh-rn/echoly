const mongoose = require('mongoose');
const uri = "mongodb://mongo:yJYobmvatNCbPALKNSJKaxlQZaTSiVOj@trolley.proxy.rlwy.net:39883";

console.log("Testing connection to Railway...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to Railway!");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAILURE: Could not connect to Railway.");
    console.error(err.message);
    process.exit(1);
  });
