import {Router} from "express";
import {healthdata} from "../controllers/health.controller.js";

const router=Router();

router.route("/form").post(healthdata);

export default router;