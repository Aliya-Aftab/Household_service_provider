import express from "express";
import { 
  createPayment, 
  updatePaymentStatus 
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", createPayment);
router.patch("/:id", updatePaymentStatus);

export default router;