const mongoose = require("mongoose");
const Group = require("./../models/group");
const GroupMessage = require("./../models/groupMessage");
const jwt = require("jsonwebtoken");
const ObjectId = mongoose.Types.ObjectId;

const groupController = {
  createGroup: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, "abc");
      const { name, members } = req.body;
      const admins = [decodedToken.userId];

      const newGroup = new Group({
        name,
        admins,
        members,
      });

      const savedGroup = await newGroup.save();

      res
        .status(201)
        .json({ message: "Group created successfully", group: savedGroup });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },
  sendMessage: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, "abc");
      const { groupId, message } = req.body;

      const isMemberOrAdmin = await Group.findOne({
        _id: groupId,
        $or: [
          { members: decodedToken.userId },
          { admins: decodedToken.userId },
        ],
      });

      if (!isMemberOrAdmin) {
        return res
          .status(403)
          .json({ error: "User is not a member of the group" });
      }

      const group = await Group.findById(groupId);

      // Ensure that 'receivers' field is provided when creating GroupMessage
      let receivers;
      if (isMemberOrAdmin.admins.includes(decodedToken.userId)) {
        // If the user is an admin, send the message to all members
        receivers = group.members.filter(
          (memberId) => memberId !== decodedToken.userId
        );
      } else {
        // If the user is a regular member, send the message to both admins and members
        receivers = [...group.members, ...group.admins].filter(
          (memberId) => memberId !== decodedToken.userId
        );
      }

      const newMessage = new GroupMessage({
        sender: decodedToken.userId,
        receivers,
        message,
        groupId,
      });

      const savedMessage = await newMessage.save();

      group.messages.push(savedMessage._id);
      await group.save();
      const messageResult = await GroupMessage.aggregate([
        { $match: { _id: savedMessage._id } },
        {
          $project: {
            _id: 0,
            __v: 0,
          },
        },
      ]);

      res.status(201).json({
        message: "Message sent successfully",
        groupMessage: messageResult[0],
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },
  getGroupDetails: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, "abc");
      const { groupId } = req.body;

      const isMemberOrAdmin = await Group.findOne({
        _id: groupId,
        $or: [
          { members: decodedToken.userId },
          { admins: decodedToken.userId },
        ],
      });

      if (!isMemberOrAdmin) {
        return res
          .status(403)
          .json({ error: "User is not a member of the group" });
      }

      const groupDetails = await Group.findById(groupId)
        .select("name admins members _id createdAt")
        .exec();

      res.status(200).json({ groupDetails });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },

  getGroupMessages: async (req, res) => {
      const token = req.headers.authorization.split(" ")[1];

      try {
          const decodedToken = jwt.verify(token, "abc");
          const groupId = req.body.groupId;

          const isMemberOrAdmin = await Group.findOne({
              _id: groupId,
              $or: [
                  { members: decodedToken.userId },
                  { admins: decodedToken.userId },
              ],
          });

          if (!isMemberOrAdmin) {
              return res.status(403).json({ error: "User is not a member of the group" });
          }

          const groupMessages = await GroupMessage.aggregate([
            {
                $match: { groupId: new ObjectId(req.body.groupId) }
              },
            
              {
                  $lookup: {
                      from: 'users',
                      localField: 'sender',
                      foreignField: 'userId',
                      as: 'senderInfo'
                  }
              },
              {
                $unwind:'$senderInfo'
              },
              {
                  $project: {
                      _id: 0,
                      message: 1,
                      createdAt: 1,
                      senderId:'$sender',
                      senderName:"$senderInfo.userName"
                  }
              }
          ]);
          res.status(200).json({ groupMessages });
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal server error", details: error.message });
      }
  }
  
//   getGroupMessages: async (req, res) => {
//     const token = req.headers.authorization.split(" ")[1];

//     try {
//       const decodedToken = jwt.verify(token, "abc");
//       const { groupId } = req.body;

//       const isMemberOrAdmin = await Group.findOne({
//         _id: groupId,
//         $or: [
//           { members: decodedToken.userId },
//           { admins: decodedToken.userId },
//         ],
//       });

//       if (!isMemberOrAdmin) {
//         return res
//           .status(403)
//           .json({ error: "User is not a member of the group" });
//       }

//       const groupMessages = await GroupMessage.find({ groupId })
//         .select("sender message createdAt")
//         .populate("sender", "userName");

//       res.status(200).json({ groupMessages });
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Internal server error", details: error.message });
//     }
//   },
};

module.exports = groupController;
