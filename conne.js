const mongoose = require('mongoose');

const atlasConnectionUri = "mongodb+srv://vaibhavk:Vaibhavkoshti@cluster0.yw09nuy.mongodb.net/expense?retryWrites=true&w=majority";

mongoose.connect(atlasConnectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connection successful");
}).catch((e) => {
  console.log("No connection:", e.message);
});
