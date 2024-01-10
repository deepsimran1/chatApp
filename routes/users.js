var express = require('express');
const userController = require('../controllers/userController');
const messageController = require('../controllers/messageController');
const groupController = require('../controllers/groupController');
var router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './uploads');
    },
    filename: function (req, file, cb){
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage: storage});

//user routes
router.post('/login', userController.userLogin);
router.post('/signup',upload.single('image'),userController.userSignup);
router.get('/getUsersList',userController.getUsersList);
//message routes
router.post('/sendMessage',upload.array('message'), messageController.sendMessage);
router.get('/getConversation/:receiver', messageController.getConversation);
router.get('/getConversationsList',messageController.getConversationsList);
//group routes
router.post('/createGroup', groupController.createGroup);
router.post('/sendgroupMessage', groupController.sendMessage);
router.get('/getGroupMessages',groupController.getGroupMessages);
router.get('/getGroupDetails', groupController.getGroupDetails);
router.post('/updateGroupPrivacy', groupController.updateGroupPrivacy);
router.post('/promoteMemberToAdmin', groupController.promoteMemberToAdmin);
router.post('/demoteAdminToMember', groupController.demoteAdminToMember);
//common routes ,,admin
router.get('/getAllUsers', userController.getAllUsers);
module.exports = router;