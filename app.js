const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");

// Connect to MongoDB
let MONGO_URL = "mongodb://127.0.0.1:27017/splitexpenses";

//model require
const User = require("./models/user");

//Passport require
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Set the view engine to EJS
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

//req data parse
app.use(express.urlencoded({ extended: true }));

//Mongo DB
main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.error(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

//Sessions setup
const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOptions));
app.use(flash());

//passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    User.authenticate()
  )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//local variable set so we can use it in ejs files
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//all route require
const authRoutes = require("./routes/authRoutes");

// Use routes
app.use("/", authRoutes);

app.get("/split",(req, res) => {
    res.render("split",{User});
});
app.get("/", (req, res) => {
    res.render("index");
})

app.listen(3000, () => {
  console.log("listening on port 3000");
});