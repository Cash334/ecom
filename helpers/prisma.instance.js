require("dotenv").config();

const {PrismaClient} = require("@prisma/client");
const {PrismaNodeSQLite} = require("prisma-adapter-node-sqlite");

const adapter = new PrismaNodeSQLite({
    url : process.env["DATABASE_URL"]
});

const prisma = new PrismaClient({
    adapter
});

module.exports = prisma;