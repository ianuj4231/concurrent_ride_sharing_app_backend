import 'dotenv/config'; // Keep this at the absolute top
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

// Fallback values match your .env setup exactly
const dbUser = process.env.DATABASE_USER || 'root'; 
const dbPassword = process.env.DATABASE_PASSWORD ; 
const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbName = process.env.DATABASE_NAME || 'mydb';
const dbPort = process.env.DB_PORT || '3306';

const adapter = new PrismaMariaDb({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: Number(dbPort),
  connectionLimit: 5,
});

const prismax = new PrismaClient({ adapter });

export { prismax };