const {z} = require("zod");

const productSchema = z.object({
    title : z.string().trim().min(5,"title must be longer than 4 characters!"),
    description : z.string().trim().min(30,"description must be longer than 29 characters"),
    price : z.coerce.number().lt(100000,"price must be less than KES.100,000")
});

module.exports = productSchema;