const mongoose = require('mongoose');
const uri = "mongodb://127.0.0.1:27017/ai-repurposing-platform";

console.log("Testing connection to Local MongoDB...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to Local MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAILURE: Could not connect to Local MongoDB.");
    console.error(err.message);
    process.exit(1);
  });
