const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/course-selling-service");
}

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "course" }],
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

const Admin = mongoose.model("admin", adminSchema);
const User = mongoose.model("user", userSchema);
const Course = mongoose.model("course", courseSchema);

const adminJwtSecret = "This is my admin jwt secret";
const userJwtSecret = "This is my user jwt secret";

async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = (authHeader && authHeader.split(" ")[1]) || null;
  if (token === null) return res.sendStatus(401);
  jwt.verify(token, adminJwtSecret, (err, admin) => {
    if (err) return res.sendStatus(403);
    req.admin = admin;
    next();
  });
}

async function authenticateUser(req, res, next) {
  const authHeader = req.headers["Authorization"];
  const token = (authHeader && authHeader.split(" ")[1]) || null;

  if (token === null) return res.sendStatus(401);
  jwt.verify(token, userJwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Admin routes
app.post("/admin/signup", async (req, res) => {
  // logic to sign up admin
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(401);
  }
  let admin = await Admin.find({ username, password });
  if (admin?.length > 0) {
    return res.status(401).json({ message: "Admin already exist" });
  }
  admin = new Admin({ username, password });
  const token = jwt.sign({ username, password }, adminJwtSecret);
  await admin.save();
  res.status(200).json({ message: "Admin created successfully", token });
});

app.post("/admin/login", (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  if (!username || !password) {
    return res.status(401);
  }
  const admin = Admin.find({ username, password });
  if (!admin) {
    return res.status(401).json({ message: "Please sign up" });
  }
  const token = jwt.sign({ username, password }, adminJwtSecret);
  res.status(200).json({ message: "Logged in successfully", token });
});

app.post("/admin/courses", authenticateAdmin, async (req, res) => {
  // logic to create a course
  const payload = req.body;
  const course = new Course(payload);
  const createdCourse = await course.save();
  res.status(200).json({
    message: "Course created successfully",
    courseId: createdCourse._id,
  });
});

app.put("/admin/courses/:courseId", authenticateAdmin, async (req, res) => {
  // logic to edit a course
  const payload = req.body;
  const courseId = req.params["courseId"];
  await Course.findByIdAndUpdate(courseId, payload);
  res.status(200).json({ message: "Course updated successfully" });
});

app.get("/admin/courses", authenticateAdmin, async (req, res) => {
  // logic to get all courses
  const adminCourses = await Course.find({ published: true });
  res.status(200).json({ courses: adminCourses });
});

// User routes
app.post("/users/signup", (req, res) => {
  // logic to sign up user
});

app.post("/users/login", (req, res) => {
  // logic to log in user
});

app.get("/users/courses", (req, res) => {
  // logic to list all courses
});

app.post("/users/courses/:courseId", (req, res) => {
  // logic to purchase a course
});

app.get("/users/purchasedCourses", (req, res) => {
  // logic to view purchased courses
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
