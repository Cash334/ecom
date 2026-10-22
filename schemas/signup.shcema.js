const {z} = require("zod");

const signupSchema = z.object({
    username : z.string().trim().min(4,"username must be longer than 3 characters"),
    password : z.string().trim().min(5,"password must be longer than 4 characters "),
    confirmPassword : z.string().trim().min(5,"password must be longer than 4 characters")
}).refine((data)=> data.password === data.confirmPassword,{
        message : "passwords did not match",
        path : ["confirmPassword"]
    });

module.exports = signupSchema;