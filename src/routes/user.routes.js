import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


const router= Router()

router.route("/register").post(
    //middleware this will help to uplad file using multer
    upload.fields([
        {
            //same name should be used in frontend field
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser
)

export default router

