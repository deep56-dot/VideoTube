
// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import ConnectDB from './db/index.js'
import { app } from './app.js'

dotenv.config({
    path:'./.env'
})

ConnectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`app is running on port http://localhost:${process.env.PORT}`)
    })
    
})
.catch((error)=>{
    console.log("MONGO DB Connection Failed ",error)
})




// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express";

// const app=express();
// //IIFE
// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on('error',(error)=>{
//             console.log(`Error ${error}`)
//             throw error; 
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`process is running on port ${process.env.PORT}`)
//         })
//         console.log("connected");
//     } catch (error) {
//         console.log(`Error ${error}`)
//         // throw error;
//         process.exit(1);
//     }
// })();