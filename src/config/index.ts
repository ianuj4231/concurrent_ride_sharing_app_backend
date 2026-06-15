import dotenv from 'dotenv';

type ServerConfig={
   port: number
}

export function loadEnv(){
    dotenv.config();
}
loadEnv()
console.log("envs loaded")

export const  serverConfig : ServerConfig ={
    port : Number(process.env.PORT) || 3001 
}