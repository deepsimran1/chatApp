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
      const createdBy = decodedToken.userId;
      const newGroup = new Group({
        name,
        admins,
        members,
        createdBy,
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
      console.log("group", group);
      if(group.privacy === 'adminOnly'){
        return res.status(403).json({error:"Only admins can send messages in this group"});
      }

      let receivers;
      if (isMemberOrAdmin.admins.includes(decodedToken.userId)) {
        receivers = group.members.filter(
          (memberId) => memberId !== decodedToken.userId
        );
      } else {
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

      const isGroupExists = await Group.exists({_id: groupId});
      if(!isGroupExists){
        return res.status(404).json({error:"group not found"});
      }

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

      const groupDetails = await Group.aggregate([
        {$match: { _id:new mongoose.Types.ObjectId(groupId)}},
        {
          $lookup:{
            from:"users",
            localField:"admins",
            foreignField:"userId",
            as:"adminDetails"
          }
        },
        {
          $lookup:{
            from:"users",
            localField:"members",
            foreignField:"userId",
            as:"memberDetails"
          }
        },
        {
          $lookup:{
            from:"users",
            localField:"createdBy",
            foreignField:"userId",
            as:"createdByDetails",
          }
        },
        {
          $unwind: "$adminDetails",
        }, 
        {
          $unwind:"$memberDetails"
        } ,
        {
          $unwind:"$createdByDetails"
        } ,
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            admins: {
              $addToSet: {
                adminId: "$adminDetails.userId",
                adminName: "$adminDetails.userName",
              },
            },
            members: {
              $addToSet:{
                memberId:"$memberDetails.userId",
                memberName:"$memberDetails.userName",
              },
            },
            createdBy: { $first: "$createdByDetails.userName" },
            createdAt: { $first: "$createdAt" },
          },
        },
  
      ])

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
  },
  updateGroupPrivacy: async(req,res)=>{
    const token = req.headers.authorization.split(" ")[1];
    try{
      const decodedToken = jwt.verify(token, "abc");
      groupIdToUpdate = req.body.groupId;

      const isUserAdmin = await Group.exists({
        _id:groupIdToUpdate,
        admins:decodedToken.userId,
      });
      
      if(!isUserAdmin){
        return res.status(403).json({error:"You are not an admin, you cannot update privacy of group"});
      }

      const updatedGroup =await Group.findByIdAndUpdate(
        groupIdToUpdate,
        {$set: { privacy: req.body.privacy}},
        {new: true}
      );

      if(!updatedGroup){
        console.log("Group not found");
      }else{
        console.log("Group privacy updated successfully to adminOnly:", updatedGroup);
        res.status(200).json({updatedGroup});
      }
     
    }catch(error){
      console.error("Error setting privacy on group:", error.message);
    }
  },
 
  promoteMemberToAdmin: async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, "abc");
      const { groupId, membersToPromote } = req.body;
      
      const isGroupExists = await Group.exists({_id: groupId});
      if(!isGroupExists){
        return res.status(404).json({error:"group not found"});
      }
      const isUserAdmin = await Group.exists({
        _id: groupId,
        admins: decodedToken.userId,
      });

      if (!isUserAdmin) {
        return res
          .status(403)
          .json({ error: "You are not an admin of this group" });
      }

      const group = await Group.findById(groupId);

      if(group.admins.includes(membersToPromote)){
        return res.status(400).json({error:"The user is alerady admin"});
      }

      if (!group.members.includes(membersToPromote)){
        return res.status(400).json({error:"the user to promte is not member of the group"});
      }
      

      // if (!Array.isArray(membersToPromote)) {
      //   return res.status(400).json({ error: "Invalid data format for membersToPromote" });
      // }

      // const invalidMembers = membersToPromote.filter(
      //   (memberId) =>
      //     !group.members.includes(memberId) && !group.admins.includes(memberId)
      // );
      

      // if (invalidMembers.length > 0) {
      //   return res.status(400).json({
      //     error: "Invalid members to promote. Some members are not part of the group.",
      //     invalidMembers,
      //   });
      // }

      // Update the group - move membersToPromote from members to admins
      // group.admins = [...new Set([...group.admins, ...membersToPromote])];
      group.admins.push(membersToPromote);
      group.members = group.members.filter(
        (memberId) => !membersToPromote.includes(memberId)
      );

      await group.save();

      res.status(200).json({
        message: "Members promoted to admins successfully",
        group,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },

 demoteAdminToMember : async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
  
    try {
      const decodedToken = jwt.verify(token, "abc");
      const { groupId, adminToDemote } = req.body;
  
      const isGroupExists = await Group.exists({_id: groupId});
      if(!isGroupExists){
        return res.status(404).json({error:"group not found"});
      }

      const isUserAdmin = await Group.exists({
        _id: groupId,
        admins: decodedToken.userId,
      });
  
      if (!isUserAdmin) {
        return res
          .status(403)
          .json({ error: "You are not an admin of this group" });
      }
  
      const group = await Group.findById(groupId);
      if (!group.admins.includes(adminToDemote)) {
        return res
          .status(400)
          .json({ error: "The user to demote is not an admin of this group" });
      }

      if(group.admins.length === 1 ){
        return res.status(400).json({error: "There must be atleast one admin in the group"});
      }
  
      group.members.push(adminToDemote);
      group.admins = group.admins.filter((adminId) => adminId !== adminToDemote);
  
      const updatedGroup = await group.save();
  
      res.status(200).json({
        message: "Admin demoted to member successfully",
        updatedGroup,
      });
    } catch (error) {
      console.error("Error demoting admin to member:", error.message);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },


  
};

module.exports = groupController;
