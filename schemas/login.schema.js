const {z} = require("zod");

const loginSchema = z.object({
    username : z.string().trim().min(4,"username must be longer than 3 characters"),
    password : z.string().trim().min(5,"password must be longer than 4 characters")
});

module.exports = loginSchema;