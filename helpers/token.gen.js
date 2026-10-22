const jwt = require("jsonwebtoken");

const tokenGen = (payload) =>{

    console.log("signing: ", payload);

    const access = jwt.sign(payload, process.env["JWT_ACCESS_SECRET"],{
        expiresIn : "15m"
    });

    const refresh = jwt.sign(payload, process.env["JWT_REFRESH_SECRET"],{
        expiresIn : "12h"
    });

    return {
        access, refresh
    };
};

module.exports = tokenGen;