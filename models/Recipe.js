const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  ingredients: { type: String, required: true },
  procedure: { type: String, required: true },
  note: { type: String },
});

module.exports = mongoose.model('Recipe', recipeSchema);