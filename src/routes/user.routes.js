import { Router } from "express";
import { loginUser, logoutUser, refreshAllTokens, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


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

//secured routes
router.route("/login").post(loginUser)
router.route("/logout").post(
    verifyJWT,
    logoutUser
)
router.route("/refresh-token").post(refreshAllTokens)

export default router

