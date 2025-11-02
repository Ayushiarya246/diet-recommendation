import {Router} from "express";
import {predictHealthRisk} from "../controllers/prediction.controller.js"

const router=Router();

router.route("/risk").post(predictHealthRisk);

export default router;