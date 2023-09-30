const express = require("express");
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

function authenticateAdmin(req, res, next) {
  const { username, password } = req.headers;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "please provide username and password in headers" });
  }
  const isAdminExist =
    ADMINS.findIndex(
      (admin) => admin.username === username && admin.password === password
    ) >= 0;
  if (isAdminExist) {
    next();
  } else {
    res.status(403).json({ message: "Admin authentication failed" });
  }
}

// Admin routes
app.post("/admin/signup", (req, res) => {
  // logic to sign up admin
  const adminUser = req.body;
  const { username, password } = adminUser;
  if (!username || !password) {
    return res.status(400);
  }
  const isAdminExist =
    ADMINS.findIndex((admin) => admin.username === username) >= 0;
  if (isAdminExist) {
    return res.status(400).json({ message: "Admin already exist" });
  }
  ADMINS.push(adminUser);
  res.status(200).json({ message: "Admin created successfully" });
});

app.post("/admin/login", authenticateAdmin, (req, res) => {
  // logic to log in admin
  res.status(200).json({ message: "Logged in successfully" });
});

app.post("/admin/courses", (req, res) => {
  // logic to create a course
});

app.put("/admin/courses/:courseId", (req, res) => {
  // logic to edit a course
});

app.get("/admin/courses", (req, res) => {
  // logic to get all courses
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
