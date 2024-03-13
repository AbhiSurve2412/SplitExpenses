const User = require("../models/user");
const Expense = require("../models/expense");

//Nodemailer Setup
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "splitease13@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
});

const expenseController = {
  getSplit: (req, res) => {
    if (!req.user) {
      req.flash("error", "You need to be logged in to Split Expenses");
      res.redirect("/login");
    } else {
      res.render("split", { User });
    }
  },

  postSplit: async(req, res) => {
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
            <li>Split Between: ${
              emails.length
            } participants (excluding yourself)</li>
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
  },

  getHistory: async(req, res) => {
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
  },
};

module.exports = expenseController;