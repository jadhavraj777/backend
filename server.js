const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure `uploads` directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// MongoDB Models
const User = require("./models/User");
const Recipe = require("./models/Recipe");
const Contact = require("./models/Contact");

// MongoDB Cluster Connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Home Page API
app.get("/", (req, res) => {
  res.send("<h1 align='center'>Welcome to the BeChef! Recipe App</h1>");
});

// User Registration API
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User Registered Successfully" });
  } catch (err) {
    console.error("Error in Registration:", err);
    res.status(500).json({ message: "Registration Failed" });
  }
});

// User Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    res.status(200).json({ message: "Login Successful", username: user.username });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login Failed" });
  }
});

// Add Recipe API
app.post("/add-recipe", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, procedure, note } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!name || !ingredients || !procedure) {
      return res.status(400).json({ message: "Name, ingredients, and procedure are required." });
    }

    // Convert ingredients from a comma-separated string into an array
    const ingredientsArray = ingredients.split(",").map((item) => item.trim());

    const recipe = new Recipe({
      name,
      image,
      ingredients: ingredientsArray,
      procedure,
      note,
    });

    // Save to database
    await recipe.save();

    res.status(201).json({ message: "Recipe added successfully!", recipe });
  } catch (err) {
    console.error("Error adding recipe:", err);
    res.status(500).json({ message: "Failed to add recipe." });
  }
});

// Get All Recipes API
app.get("/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json(recipes);
  } catch (err) {
    console.error("Error Fetching Recipes:", err);
    res.status(500).json({ message: "Failed to Fetch Recipes" });
  }
});

// Get Recipe by ID API
app.get("/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe Not Found" });
    }
    res.status(200).json(recipe);
  } catch (err) {
    console.error("Error Fetching Recipe:", err);
    res.status(500).json({ message: "Failed to Fetch Recipe" });
  }
});


// Contact Form Submission API
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contact = new Contact({ name, email, message });
    await contact.save();

    res.status(201).json({ message: "Thank You! Your Message Has Been Sent." });
  } catch (err) {
    console.error("Error in Contact Form Submission:", err);
    res.status(500).json({ message: "Failed to Send Message" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
});
