import ServiceCategory from "../models/ServiceCategory.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const cleanName = name.trim();
    const existing = await ServiceCategory.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") }
    });

    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await ServiceCategory.create({
      name: cleanName,
      description: description ? description.trim() : "",
      isActive: true,
    });

    return res.status(201).json(category);
  } catch (err) {
    console.error("Create category error:", err);
    return res.status(500).json({ message: err.message || "Failed to create category" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 });
    return res.json(categories);
  } catch (err) {
    console.error("Get categories error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch categories" });
  }
};