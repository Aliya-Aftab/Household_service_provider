import ServiceCategory from "../models/ServiceCategory.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await ServiceCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await ServiceCategory.create({
      name,
      description,
      isActive: true
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};