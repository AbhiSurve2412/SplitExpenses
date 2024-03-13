if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

// Connect to MongoDB
// let MONGO_URL = "mongodb://127.0.0.1:27017/splitexpenses";
const dbUrl = process.env.ATLASDB_URL;

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
  await mongoose.connect(dbUrl);
}


//connect mongo(Used for Deployment)
const store = MongoStore.create({
  mongoUrl : dbUrl,
  crypto : {
    secret: "mysupersecretcode",
  },
  touchAfter : 24*3600,
});
store.on('error', err => console.log("ERROR IN MONGO CONNECT",err));

//Sessions setup
const sessionOptions = {
  store,
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

//Require route
const route = require("./routes/route");
app.use(route);

app.listen(3000, () => {
  console.log("listening on port 3000");
});
