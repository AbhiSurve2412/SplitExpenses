const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// Configure passport-local-mongoose with custom options
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

// Check if the model exists before compiling it
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
