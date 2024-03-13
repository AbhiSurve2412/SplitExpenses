if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");

//Nodemailer Setup
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "splitease13@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
});

// Connect to MongoDB
let MONGO_URL = "mongodb://127.0.0.1:27017/splitexpenses";

//model require
const User = require("./models/user");
const Expense = require("./models/Expense");

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

app.get("/history", async (req, res) => {
  if (!req.user) {
    req.flash("error", "Please Log-In To See History");
    res.redirect("/login");
  } else {
    try {
      const expenses = await Expense.find({ userId: req.user._id })
        .sort({ date: -1 })
        .lean();
      res.render("history", { expenses });
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      req.flash("error", "Failed to fetch expense history.");
      res.redirect("/");
    }
  }
});
app.get("/split", (req, res) => {
  if (!req.user) {
    req.flash("error", "You need to be logged in to Split Expenses");
    res.redirect("/login");
  } else {
    res.render("split", { User });
  }
});

app.post("/split", async (req, res) => {
  const { amount, description, emails } = req.body;
  const totalParticipants = emails.length + 1;
  const splitAmount = amount / totalParticipants;
  const sharePerEmail = amount / totalParticipants;

  const emailList = emails.join(", ");
  const emailBody = `
    <p>Hello,</p>
    <p>The expense for <strong>'${description}'</strong> has been calculated and needs to be split among the participants. Here are the details:</p>
    <ul>
      <li>Total Amount: ₹${amount}</li>
      <li>Split Between: ${emails.length} participants (excluding yourself)</li>
      <li>Your Share: ₹${splitAmount.toFixed(2)}</li>
      <li>Each Participant's Share: ₹${sharePerEmail.toFixed(2)}</li>
    </ul>
    <p>Please make sure to settle your share at your earliest convenience. If you have any questions, feel free to reply to this email.</p>
    <p>Best,</p>
    <p>${req.user.fullName}</p>
  `;

  let mailOptions = {
    from: '"SplitEase Platform" <splitease13@gmail.com>',
    to: emailList,
    subject: "Your Split Expense Details",
    text: `The expense for '${description}' has been split. Your share is ₹${splitAmount.toFixed(
      2
    )}. Each participant's share is ₹${sharePerEmail.toFixed(2)}rs.`,
    html: emailBody,
  };

  // Attempt to send the email
  transporter
    .sendMail(mailOptions)
    .then(async (info) => {
      console.log("Message sent: %s", info.messageId);
      // Email sent successfully, now save the expense
      try {
        const newExpense = new Expense({
          userId: req.user._id,
          amount: amount,
          description: description,
          emails: emails,
          date: new Date(),
        });

        await newExpense.save();
        console.log("Expense record saved successfully.");
        req.flash(
          "success",
          "Expenses successfully split and notifications sent!"
        );
        res.redirect("/");
      } catch (saveError) {
        console.error("Error saving expense record:", saveError);
        req.flash(
          "error",
          "Expense was split and emails sent, but failed to save the record."
        );
        res.redirect("/split");
      }
    })
    .catch((sendError) => {
      // Handle email sending error
      console.error("Error sending email:", sendError);
      req.flash(
        "error",
        "Failed to split expenses and send notifications. Please try again."
      );
      res.redirect("/split");
    });
});

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
