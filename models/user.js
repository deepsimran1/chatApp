const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    image:{
        type:String,
    }
    
});

const User = mongoose.model("User", userSchema);

module.exports = User;