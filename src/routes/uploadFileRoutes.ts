import { Router } from "express";
import { verifyUserToken } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/multer.js";
import {
  uploadFiles,
  downloadFile,
  getSignedUrl,
  uploadFile,
} from "../controllers/uploadFileController.js";

const router = Router();

router.post("/file", upload.single("file"), uploadFile);
router.post("/files", upload.array("files", 10), verifyUserToken, uploadFiles);

router.get("/download", downloadFile);
router.post("/get-signed-url", getSignedUrl);

export const uploadFileRoutes = router;
