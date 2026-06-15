import express from "express";
import { pingHandler } from "../controllers/ping.controller.js";
import { validateRequestBody, userBodySchema } from '../validators/index.js';
const pingRouter = express.Router()

pingRouter.post('/ping', validateRequestBody(userBodySchema), pingHandler)

pingRouter.get('/ping',  pingHandler)





export default pingRouter;