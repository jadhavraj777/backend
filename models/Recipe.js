const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String }, // Image URL
  ingredients: { type: [String], required: true }, // Array of strings for ingredients
  procedure: { type: String, required: true },
  note: { type: String },
});

module.exports = mongoose.model("Recipe", recipeSchema);
