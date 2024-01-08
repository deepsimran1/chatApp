const Message = require("./../models/message");
const jwt = require("jsonwebtoken");
const Group = require('../models/group');
const messageController = {
  sendMessage: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, "abc");
      const { receiver, message } = req.body;
      const senderId = decodedToken.userId;
      const conversationId = `${senderId}_${receiver}_${Date.now()}`;

      const files = req.files;

      let newMessage;
      if (files && files.length > 0 && message) {
        newMessage = new Message({
          sender: senderId,
          receiver: receiver,
          message: [...files.map((file) => file.path), message],
          conversationId: conversationId,
        });
      } else if (files && files.length > 0) {
        newMessage = new Message({
          sender: senderId,
          receiver: receiver,
          message: files.map((file) => file.path),
          conversationId: conversationId,
        });
      } else {
        newMessage = new Message({
          sender: senderId,
          receiver: receiver,
          message: message,
          conversationId: conversationId,
        });
      }

      await newMessage.save();
      res
        .status(201)
        .json({
          message: "Message sent successfully",
          conversationId: conversationId,
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },

  getConversation: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, "abc");
      const { receiver } = req.params;
      const senderId = decodedToken.userId;

      const messages = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: senderId, receiver: receiver },
              { sender: receiver, receiver: senderId },
            ],
          },
        },
        {
          $sort: { createdAt: 1 },
        },
        {
          $group: {
            _id: {
              sender: "$sender",
              receiver: "$receiver",
            },
            messages: {
              $push: {
                message: "$message",
                date_time: {
                  $dateToString: {
                    format: "%Y-%m-%d %H:%M:%S",
                    date: "$createdAt",
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id.sender",
            foreignField: "userId",
            as: "senderDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id.receiver",
            foreignField: "userId",
            as: "receiverDetails",
          },
        },
        {
          $unwind: "$senderDetails",
        },
        {
          $unwind: "$receiverDetails",
        },
        {
          $project: {
            _id: 0,
            senderId: "$_id.sender",
            senderName: "$senderDetails.userName",
            receiverId: "$_id.receiver",
            receiverName: "$receiverDetails.userName",
            messages: 1,
          },
        },
      ]);

      res.status(200).json({ conversation: messages });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },

  
  getConversationsList: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, "abc");
      const loggedInUserId = decodedToken.userId;

      // Get user's conversations from one-on-one messages
      const oneOnOneConversations = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: loggedInUserId }, { receiver: loggedInUserId }],
          },
        },
        {
          $project: {
            userId: {
              $cond: {
                if: { $eq: ["$sender", loggedInUserId] },
                then: "$receiver",
                else: "$sender",
              },
            },
            messageType: {
              $cond: {
                if: { $eq: ["$sender", loggedInUserId] },
                then: "message sent",
                else: "message received",
              },
            },
            createdAt: 1,
            message: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $group: {
            _id: "$userId",
            latestMessage: { $first: "$$ROOT" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "userId",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            userId: "$latestMessage.userId",
            userName: "$userDetails.userName",
            latestMessage: "$latestMessage.message",
            messageType: "$latestMessage.messageType",
            time: "$latestMessage.createdAt",
            _id: 0,
          },
        },
      ]);

      // Get user's group conversations and their latest messages
      const groupConversations = await Group.aggregate([
        {
          $match: {
            $or: [{ members: loggedInUserId }, { admins: loggedInUserId }],
          },
        },
        {
          $unwind: "$messages",
        },
        {
          $lookup: {
            from: "groupmessages",
            localField: "messages",
            foreignField: "_id",
            as: "groupMessage",
          },
        },
        {
          $unwind: "$groupMessage",
        },
        {
          $sort: {
            "groupMessage.createdAt": -1,
          },
        },
        {
          $group: {
            _id: "$_id",
            groupName: {$first: "$name"},
            latestGroupMessage: { $first: "$groupMessage" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "latestGroupMessage.sender",
            foreignField: "userId",
            as: "senderDetails",
          },
        },
        {
          $unwind: "$senderDetails",
        },
        {
          $project: {
            _id:0,
            groupId: "$_id",
            groupName:1,
            sender:{
              $cond:{
                if:{$eq:["$senderDetails.userId", loggedInUserId]},
                then:"You",
                else:"$senderDetails.userName"
              }
            },
            latestMessage: "$latestGroupMessage.message",
            messageType: "group message",
            time: "$latestGroupMessage.createdAt",
          },
        },
      ]);

      // Combine one-on-one and group conversations
      const allConversations = [...oneOnOneConversations, ...groupConversations];

      // Sort all conversations based on time
      const sortedConversations = allConversations.sort((a, b) => b.time - a.time);

      res.status(200).json({ conversationsList: sortedConversations });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },

};
module.exports = messageController;
