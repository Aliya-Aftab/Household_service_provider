import mongoose from "mongoose";
const ServiceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Plumber, Electrician
  description: String,
  isActive: { type: Boolean, default: true }
});


export default mongoose.model("ServiceCategory", ServiceCategorySchema);