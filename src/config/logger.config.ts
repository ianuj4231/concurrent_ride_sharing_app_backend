import { time } from "console";
import winston from "winston";
import { json } from "zod";
import { getJobCorrelationId } from "../utils/context.store.js";

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json(),
        winston.format.printf(({ level,message, timestamp,...data }) => {
            const output={level,message,timestamp, correlationId: getJobCorrelationId()  ,  data};
            return JSON.stringify(output)
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

export default logger;