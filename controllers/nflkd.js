

// getAllMessages: async (req, res) => {
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
//         return res.status(403)
//           .json({ error: "User is not a member of the group" });
//       }

//       const messages = await GroupMessage.aggregate([
//         { $match: { groupId} },
//         {
//           $lookup: {
//             from: "users", // Assuming your user collection is named "users"
//             localField: "sender",
//             foreignField: "userId",
//             as: "senderDetails",
//           },
//         },
//         {
//           $project: {
//             _id: 0,
//             __v: 0,
//             "senderDetails._id": 0,
//             "senderDetails.password": 0,
//           },
//         },
//       ]);

//       res.status(200).json({ messages });
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Internal server error", details: error.message });
//     }
//   },
 