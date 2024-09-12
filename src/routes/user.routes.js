import { Router } from "express";
import { changePassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAllTokens, 
    registerUser, 
    updateUserAvatar, 
    updateUserDetails } 
    from "../controllers/user.controller.js";
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
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateUserDetails)
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar)
router.route("/update-coverImage").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserDetails)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistory)

export default router

