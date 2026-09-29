import express from "express";
import { 
  registerUser, 
  loginUser,
  getUsers,
  deleteUser,
  updateUserLocation
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getUsers);
router.delete("/:id", deleteUser);
router.patch("/location", updateUserLocation);

export default router;