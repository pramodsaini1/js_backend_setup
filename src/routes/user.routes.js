import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registeruser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registeruser
    );
router.route("/login").post(loginUser)

//secured routed
router.route("/logout").post( verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)


export default router; //AAGE IMPORT KRTE TIME MANCHAHA NAAM DE SKTE HAI default HAI TB