import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllLikedVideos, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";


const router= Router()
router.use(verifyJWT)

router.route("/toggleLike/v/:videoId").post(toggleVideoLike)
router.route("/toggleLIke/v/:commentId").post(toggleCommentLike)
router.route("/videos").get(getAllLikedVideos)

export default router