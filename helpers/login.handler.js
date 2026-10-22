const bcrypt = require("bcryptjs");
const prisma = require("./prisma.instance");

const IsVerified = async(details)=>{

    const {username, password} = details;

    try{
        const match = await prisma.user.findUnique({
            where:{
                username : username
            }
        });

        if(!match){
            return false
        };

        const passwordHash = match.passwordHash;

        const isGood = await bcrypt.compare(password, passwordHash);

        if(!isGood){
            return false
        };

        console.log("match: ", match);
        return match

}catch(err){
    console.log("user error: ", err);

    return false
}
};

module.exports = IsVerified;