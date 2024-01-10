const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const multer = require("multer");
const upload = multer({ dest: "uploads/" }); 

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.get("/data", async (req, res) => {
  try {
    // const result=[{
    //   user:"name",
    //   email:""
    // }]
    //   const username = 'Simran';
    const data = await userController.getAllUsers();
    console.log("data", data);
    res.render("index", { data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server Eroor", details: error.message });
  }
});

router.get('/userList', async(req,res)=>{
  try{
    const data =  await userController.getUsersList(req);
  console.log("data", data);
  res.render("userData", {data});
  }catch(error){
    console.error(error);
    res.status(500).json({error: 'Internal server error', details:error.message});
  }
}); 


router.get("/signup", (req, res) => {
  res.render("signup");
});


router.post("/signup",upload.single("image"), async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    const { userId, userName, password } = req.body;
    console.log("Received data:", userId, userName, password);

    await userController.userSignup(req, res);

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server Error", details: error.message });
  }
});


router.get('/login', async(req,res)=>{
  res.render("login");
});

router.post("/login", async(req,res)=> {
  try{
    console.log("Received request body: ",req.body);

    
    const { userId, password } = req.body;
    console.log("Received data:", userId, password);

    const token = await userController.userLogin(req,res);
    if(token){
     res.cookie("authToken", token, {httpOnly: true});

      res.status(200).json({message:'Login successful', token});
    }else{
      res.status(401).json({error: 'Unauthorized', details:'Invalid credentials' });
    }
  }catch(error){
    console.error(error);
    res.status(500).json({error: 'Internal Server Error', details:error.message});
  }
});


module.exports = router;
