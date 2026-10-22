require("dotenv").config();

const jwt = require("jsonwebtoken");
const tokenGen = require("../helpers/token.gen");

const isAuth = async(req, res, next) =>{

    const access = req.cookies?.access;
    const refresh = req.cookies?.refresh;

    console.log(req.cookies);

    if(!access || !refresh){

        return res.status(400).json({
            status : "error",
            error : "user not recognized"
        });
    };

    try{
        jwt.verify(access, process.env["JWT_ACCESS_SECRET"],async (err, decodedUser)=>{

            if(err && err.name === "TokenExpiredError"){
                //attempt to refresh

                try{
                    const payload = jwt.verify(refresh, process.env["JWT_REFRESH_SECRET"]);

                    if(payload.username && payload.id){

                        const newTokens = await tokenGen({username : payload.username, id : payload.id});
                        
                        const newAccess = newTokens.access;
                        const newRefresh = newTokens.refresh;

                        res.cookie("access", newAccess);
                        res.cookie("refresh", newRefresh);

                        console.log("payload: ",payload);

                        req.user = {
                            username : payload.username,
                            id : payload.id
                        };

                        return next();
                    };

                    return res.status(400).json({
                        status : "error",
                        error : "session expired!"
                    });

                }catch(err){
                    console.log("auth error: ", err);

                    return res.status(400).json({
                        status : "error",
                        error : "couldn't verify user!"
                    });
                };
            };

            if(err){
                return res.status(400).json({
                        status : "error",
                        error : "couldn't verify user!"
                });
            }
            console.log("decoded:  ", decodedUser);
            req.user = {
                username : decodedUser.username,
                id : decodedUser.id
            };

            return next();
        });
    }catch(err){
        console.log("auth error bottom:  ", err);

        return res.status(400).json({
                        status : "error",
                        error : "couldn't verify user!"
            });
    }
};

module.exports = isAuth;