const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let themeSchema = new Schema({
  background: {
    type: String,
    require: true,
  },
  textcolor: {
    type: String,
    require: true,
  },
  bannerbg:{
    type: String,
    require: true,
  },
  name:{
    type: String,
    require: true,
  }
});

let theme = mongoose.model("Theme", themeSchema);
module.exports = theme;
