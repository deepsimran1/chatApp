// const Message = require('./../models/message');
// const jwt = require('jsonwebtoken');

// const messageController= {
//     sendMessage: async(req,res)=>{
//         const token = req.headers.authorization.split(' ')[1];
//         try{
//             const decodedToken = jwt.verify(token, 'abc');
//             const {receiver, message} =req.body;
//             const senderId = decodedToken.userId;
//             const conversationId = `${senderId}_${receiver}_${Date.now()}`;

//             const newMessage = new Message ({
//                 sender:senderId,
//                 receiver:receiver,
//                 message:message,
//                 conversationId:conversationId,
//             });
//             await newMessage.save();
//             res.status(201).json({message:'Message sent successfully',conversationId:conversationId});
//         }catch(error){
//             console.error(error);
//             res.status(500).json({error:'Internal server error', details:error.message});
//         }
//     },
  
//     getConversation: async (req, res) => {
//         const token = req.headers.authorization.split(' ')[1];
//         try {
//             const decodedToken = jwt.verify(token, 'abc');
//             const { receiver } = req.params;
//             const senderId = decodedToken.userId;

//             const conversationIdWithoutDate = `${senderId}_${receiver}`;

//             const messages = await Message.aggregate([
//                 {
//                     $match: {
//                         conversationId: { $regex: new RegExp(conversationIdWithoutDate, 'i') },
//                         $or: [
//                             { sender: senderId, receiver: receiver },
//                             { sender: receiver, receiver: senderId },
//                         ],
//                     },
//                 },
//                 {
//                     $project: {
//                         _id: 0,
//                         sender: 1,
//                         receiver: 1,
//                         message: 1,
//                         time: { $dateToString: { format: '%Y-%m-%d %H:%M:%S', date: '$createdAt' } },
//                     },
//                 },
//                 {
//                     $sort: { time: 1 },
//                 },
//             ]);

//             res.status(200).json({ conversation: messages });
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ error: 'Internal server error', details: error.message });
//         }
//     },



// }
// module.exports = messageController;