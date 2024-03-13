const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const authController = require('../controllers/authController');
const expenseController = require('../controllers/expenseController');

// Home Page
router.get('/', homeController.getHome);

// Auth Routes
router.get('/login', authController.getLogin)
     .post('/login', authController.postLogin);
router.get('/logout', authController.getLogout);
router.get('/signup', authController.getSignup)
     .post('/signup', authController.postSignup);

// Expense Routes
router.get('/split', expenseController.getSplit)
     .post('/split', expenseController.postSplit);
router.get('/history', expenseController.getHistory);

module.exports = router;
