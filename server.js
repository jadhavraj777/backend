const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const multer = require('multer'); // For handling file uploads
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;


app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Server is running on port: " + PORT);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images

// MongoDB Models
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const Contact = require('./models/Contact');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("DB connected successfully.."))
  .catch((err) => console.log(err));

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Home Page API
app.get('/', (req, res) => {
  res.send("<h1 align=center>Welcome to the BeChef! Recipe App</h1>");
});

// User Registration API
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: "User Registered Successfully" });
    console.log("User Registration Completed...");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Registration Failed" });
  }
});

// User Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    res.json({ message: "Login Successful", username: user.username });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login Failed" });
  }
});

// Add Recipe API
app.post('/add-recipe', upload.single('image'), async (req, res) => {
  const { name, ingredients, procedure, note } = req.body;
  const image = req.file ? req.file.filename : null; // Save the uploaded image filename
  try {
    const recipe = new Recipe({ name, image, ingredients, procedure, note });
    await recipe.save();
    res.json({ message: "Recipe Added Successfully", recipe });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to Add Recipe" });
  }
});

// Get All Recipes API
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to Fetch Recipes" });
  }
});

// Get Recipe by ID API
app.get('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe Not Found" });
    }
    res.json(recipe);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to Fetch Recipe" });
  }
});

// Contact Form Submission API
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.json({ message: "Thank You! Your Message Has Been Sent." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to Send Message" });
  }
});

