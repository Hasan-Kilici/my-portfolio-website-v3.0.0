 const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let statsSchema = new Schema(
  {
    lang: {
      type: String,
      require: true,
    },
    level: {
      type: String,
      require: true,
    },
    color: {
      type: String,
      require: true,
    },
    logo:{
      type: String,
      require: true,
    },
  },
  { timestamp: true }
);

let stats = mongoose.model("Stats", statsSchema);
module.exports = stats;
