const mongoose = require('mongoose');
const groupMessageSchema = new mongoose.Schema({
    sender:{
        type:String,
        required:true,
    },
    receivers:[
        {
            type:String,
            required:true
        }
    ],
    message:{
        type: String, 
        required:true,
    },
    groupId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group',
        required:true,
    }
},{
    timestamps:true
});

const groupMessage = mongoose.model('GroupMessage', groupMessageSchema);

module.exports = groupMessage;