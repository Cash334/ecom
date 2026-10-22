require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const signupSchema = require("./schemas/signup.shcema");
const loginSchema = require("./schemas/login.schema");
const IsVerified = require("./helpers/login.handler");
const tokenGen = require("./helpers/token.gen");
const bcrypt = require("bcryptjs");

const prisma = require("./helpers/prisma.instance");
const isAuth = require("./middleware/auth.middleware");
const productSchema = require("./schemas/product.schema");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT;

const storage = multer.diskStorage({
    destination : path.join(__dirname,"static","products"),
    filename : (req, file, cb)=>{

        const uniqueName = file.originalname + "_" + Date.now() + "_" + Math.floor(Math.random() * 10**9);
        
        cb(null, uniqueName);
    }
});

const upload = multer({storage});

app.set("view engine","ejs");
app.set("views", "templates");

app.use("/static",express.static(path.join(__dirname,"static")));

app.use(express.json());
app.use(cookieParser());

app.get("/",(req, res)=>{

    //default route
    return res.status(200).render("main.ejs");
});

app.post("/signup",async(req, res)=>{

    const validated = signupSchema.safeParse(req.body);

    if(!validated.success){

        console.log("xxxxxxxxxxxxxxxxxx1");
        console.log(validated.error);

        return res.status(400).json({
            status : "fail",
            error : validated.error.errors[0].message
        });
    };

    console.log("validxxxxxxxxxxxx");

    const {username, password} = validated.data;

    try{
        //procees to add the user to the database
        const hashedPass = bcrypt.hashSync(password, 12);

        const created = await prisma.user.create({
            data : {
                username : username,
                passwordHash : hashedPass
            }
        });

        if(!created){
            console.log("creationxxxxxxxxxxxxxx");

            return res.status(400).json({
                status : "error"
            });
        };

        console.log("yyyyyyyyyyyyyyyyyyyy");

        return res.status(201).json({
            status : "success"
        });

    }catch(err){
        console.log("errorfffffffffff: ",err);

        return res.status(400).json({
            status : "error"
        });
    };

});

app.post("/login", async(req, res)=>{

    const validated = loginSchema.safeParse(req.body);

    if(!validated.success){

        console.log(validated.error.errors);

        return res.status(400).json({
            status : "error",
            errors : validated.error.errors[0].message
        });
    };

    const {username, password} = validated.data;
    console.log(validated.data);

    const isGood = await IsVerified({username, password});

    if(!isGood){
        return res.status(400).json({
            msg : "invalid credentials"
        });
    };

    console.log("isgood: ",isGood);

    const payload = {
        username : isGood.username,
        id : isGood.id
    };

    const {access, refresh} = tokenGen(payload);

    res.cookie("access", access,{
        httpOnly : true,
        secure : false
    });

    res.cookie("refresh",refresh,{
        httpOnly : true,
        secure : false
    });

    return res.status(200).json({
        status : "success"
    });

});

app.use(isAuth);

app.get("/marketplace", async (req, res)=>{

    try{
        const products = await prisma.product.findMany({
            select : {
                id : true,
                price : true,
                description : true,
                title : true,
                filename : true,
                owner : {
                    select : {
                        id : true,
                        username : true
                    }
                }
            }
        });

        const menu = [];

        for(const product of products){

            const imagePath = path.join(__dirname,"static","products",product.filename);

            if(!fs.existsSync(imagePath)) continue;

            const item = {
                ...product,
                imageLink : `http://127.0.0.1:${PORT}/static/products/${product.filename}`
            };

            menu.push(item);
        };

        return res.status(200).render("marketplace.ejs",{
            menu
        });
    }catch(err){
        console.log("product error: ",err);

        return res.status(400).json({
            status : "error",
            error : "something went wrong!"
        });
    }
});

app.post("/marketplace",upload.single("image"), async(req, res)=>{

    const validBody = productSchema.safeParse(req.body);

    if(!validBody.success){

        return res.status(400).json({
            status : "error",
            error : validBody.error.errors[0].message
        });
    };

    const {title, description, price} = validBody.data;

    const image = req.file;
    
    if(!image){

        return res.status(400).json({
            status : "error",
            error : "all products must have valid images!"
        });
    };

    const originalname = image.originalname;
    const filename = image.filename;

    console.log("user: ", req.user);
    try{
        const createdProduct = await prisma.product.create({
            data : {
                ownerId : parseInt(req.user.id),
                title : title,
                description : description,
                price : price,
                originalname : originalname,
                filename : filename
            },
            select : {
                id : true,
                title : true,
                description : true,
                price : true,
                owner : {
                    select : {
                        username : true,
                        id : true
                    }
                }
            }
        });

        if(!createdProduct){
            return res.status(400).json({
                status : "error",
                error : "something went wrong"
            });
        };

        return res.status(201).json({
            createdProduct
        });
    }catch(err){

        console.log("marketplace post error: ", err);
        return res.status(400).json({
            status : "error",
            error : "could not create your product!"
        });
    };

});

app.listen(PORT,()=>{
    console.log(`server running at http://127.0.0.1:${PORT}`);
});