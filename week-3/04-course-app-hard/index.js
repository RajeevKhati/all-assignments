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
  const authHeader = req.headers["authorization"];
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
  res.status(200).json({ message: "Admin logged in successfully", token });
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
app.post("/users/signup", async (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(401);
  }
  let user = await User.find({ username, password });
  if (user?.length > 0) {
    return res.status(401).json({ message: "User already exist" });
  }
  user = new User({ username, password });
  const token = jwt.sign({ username, password }, userJwtSecret);
  await user.save();
  res.status(200).json({ message: "User created successfully", token });
});

app.post("/users/login", (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  if (!username || !password) {
    return res.status(401);
  }
  const user = User.find({ username, password });
  if (!user) {
    return res.status(401).json({ message: "Please sign up" });
  }
  const token = jwt.sign({ username, password }, userJwtSecret);
  res.status(200).json({ message: "User logged in successfully", token });
});

app.get("/users/courses", authenticateUser, async (req, res) => {
  // logic to list all courses
  let courses = await Course.find();
  res.status(200).json({ courses });
});

app.post("/users/courses/:courseId", authenticateUser, async (req, res) => {
  // logic to purchase a course
  try {
    const courseId = req.params["courseId"];
    const course = await Course.findById(courseId).exec();
    const username = req.user.username;
    if (!course) {
      return res.status(300).json({ message: "Course not found.." });
    }
    const doc = await User.findOneAndUpdate(
      { username },
      {
        $addToSet: { purchasedCourses: course._id },
      },
      { new: true }
    );
    if (!doc) {
      return res.status(300).json({ message: "No Docs updated.." });
    }
    res.status(200).json({ message: "Course purchased successfully" });
  } catch (err) {
    res.status(400).json({ message: "Something went wrong" });
  }
});

app.get("/users/purchasedCourses", authenticateUser, async (req, res) => {
  // logic to view purchased courses
  const currentUser = await User.findOne({ username: req.user.username })
    .populate("purchasedCourses")
    .exec();
  const purchasedCourses = currentUser.purchasedCourses;
  res.status(200).json({ purchasedCourses });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
