const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    admins:[
        {
            type:String,
            ref:'User'
        },
    ],
    members:[
        {
            type:String,
            ref:'User'
        }
    ],
    messages:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'GroupMessage'
        }
    ]
},{timestamps:true});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;