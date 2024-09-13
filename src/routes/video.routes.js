import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";


const router= Router()
router.use(verifyJWT)

router
.route("/")
.get(getAllVideos)
.post(
    
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
        
    ]),publishAVideo)

router
.route("/v/:videoId")
.get(getVideoById)
.patch(
    upload.single("thumbnail"),
    updateVideo
)
.delete(deleteVideo)

router
.route("/toggle/publish/:videoId")
.patch(togglePublishStatus)

export default router