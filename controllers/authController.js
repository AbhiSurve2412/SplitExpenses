const passport = require("passport");
const User = require("../models/user");

const authController = {
  // Display signup form
  getSignup: (req, res) => {
    res.render("users/signup");
  },

  // Handle user signup
  postSignup: async (req, res, next) => {
    try {
      const { fullName, email, password } = req.body;
      const newUser = new User({ email, fullName });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, err => {
        if (err) return next(err);
        req.flash("success", "Welcome to Image Vault!");
        res.redirect("/");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  },

  // Display login form
  getLogin: (req, res) => {
    res.render("users/login");
  },

  // Handle user login
  postLogin: passport.authenticate("local", { 
    failureRedirect: "/login", 
    failureFlash: true,
    successRedirect: "/",
    successFlash: "Welcome back to Image Vault!"
  }),

  // Handle user logout
  logout: (req, res) => {
    req.logout(err => {
      if (err) return next(err);
      req.flash("success", "Successfully logged out");
      res.redirect("/");
    });
  }
};

module.exports = authController;
