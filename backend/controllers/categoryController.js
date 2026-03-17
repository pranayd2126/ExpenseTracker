  import Category from "../models/categorySchema.js";

  // Seed default categories once
  const DEFAULT_CATEGORIES = [
    { name: "Food & Dining", type: "expense", isDefault: true },
    { name: "Transport", type: "expense", isDefault: true },
    { name: "Shopping", type: "expense", isDefault: true },
    { name: "Entertainment", type: "expense", isDefault: true },
    { name: "Health", type: "expense", isDefault: true },
    { name: "Utilities", type: "expense", isDefault: true },
    { name: "Rent", type: "expense", isDefault: true },
    { name: "Education", type: "expense", isDefault: true },
    { name: "Other Expense", type: "expense", isDefault: true },
    { name: "Salary", type: "income", isDefault: true },
    { name: "Business Income", type: "income", isDefault: true },
    { name: "Freelance", type: "income", isDefault: true },
    { name: "Investment", type: "income", isDefault: true },
    { name: "Other Income", type: "income", isDefault: true },
  ];

  export const seedDefaultCategories = async () => {
    try {
      const existingCount = await Category.countDocuments({ isDefault: true });
      if (existingCount === 0) {
        await Category.insertMany(DEFAULT_CATEGORIES);
        console.log("Default categories seeded");
      }
    } catch (error) {
      console.error("Error seeding categories:", error);
    }
  };

  export const getCategories = async (req, res) => {
    try {
        const { type } = req.query;
        const typeFilter = ["income", "expense"].includes(type) ? { type } : {};

      const categories = await Category.find({
          ...typeFilter,
        $or: [{ isDefault: true }, { userId: req.userId }],
      });

      res.status(200).json({
        success: true,
        count: categories.length,
        categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching categories",
        error: error.message,
      });
    }
  };

  export const addCategory = async (req, res) => {
    try {
      const { name, type } = req.body;
      const MAX_CUSTOM_CATEGORIES = 10;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: "name and type are required",
        });
      }

      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "type must be income or expense",
        });
      }

      const existing = await Category.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        $or: [{ isDefault: true }, { userId: req.userId }],
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      const customCount = await Category.countDocuments({ userId: req.userId, isDefault: false });
      if (customCount >= MAX_CUSTOM_CATEGORIES) {
        return res.status(400).json({
          success: false,
          message: `You can create up to ${MAX_CUSTOM_CATEGORIES} custom categories only`,
        });
      }

      const category = await Category.create({
        name,
        type,
        isDefault: false,
        userId: req.userId,
      });

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating category",
        error: error.message,
      });
    }
  };

  export const deleteCategory = async (req, res) => {
    try {
      const category = await Category.findOne({
        _id: req.params.id,
        userId: req.userId,
        isDefault: false,
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found or cannot delete a default category",
        });
      }

      await category.deleteOne();

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting category",
        error: error.message,
      });
    }
  };
