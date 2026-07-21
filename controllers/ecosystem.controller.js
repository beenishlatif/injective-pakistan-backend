/**
 * ecosystemController.js  (ESM version)
 * ------------------------------------------------------------------
 * Business logic for the Ecosystem directory (Ecosystem.jsx).
 * All responses follow { success: boolean, ...data } or
 * { success: false, error: "message" } on failure.
 *
 * Use this version if your project's package.json has "type": "module".
 * ------------------------------------------------------------------
 */

import EcosystemProject from "../models/Ecosystem.model.js";

// ---- GET /api/ecosystem/projects?search=&category=&page=&limit= ----
export const getProjects = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const { search, category } = req.query;

    const filter = { status: "approved" };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const totalCount = await EcosystemProject.countDocuments(filter);

    const projects = await EcosystemProject.find(filter)
      .sort(search ? { score: { $meta: "textScore" } } : { featured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      projects,
      page,
      totalCount,
      hasMore: page * limit < totalCount,
    });
  } catch (err) {
    console.error("getProjects error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch projects" });
  }
};

// ---- GET /api/ecosystem/projects/featured ----
export const getFeaturedProjects = async (req, res) => {
  try {
    const projects = await EcosystemProject.find({ status: "approved", featured: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.json({ success: true, projects });
  } catch (err) {
    console.error("getFeaturedProjects error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch featured projects" });
  }
};

// ---- GET /api/ecosystem/projects/:idOrSlug ----
export const getProjectByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const project = await EcosystemProject.findOne(
      isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
    ).lean();

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    return res.json({ success: true, project });
  } catch (err) {
    console.error("getProjectByIdOrSlug error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch project" });
  }
};

// ---- GET /api/ecosystem/stats ----
export const getStats = async (req, res) => {
  try {
    const [totalProjects, categoryAgg, tvlAgg] = await Promise.all([
      EcosystemProject.countDocuments({ status: "approved" }),
      EcosystemProject.distinct("category", { status: "approved" }),
      EcosystemProject.aggregate([
        { $match: { status: "approved", tvl: { $ne: null } } },
        { $group: { _id: null, total: { $sum: "$tvl" } } },
      ]),
    ]);

    return res.json({
      success: true,
      stats: {
        totalProjects,
        categoryCount: categoryAgg.length,
        totalTvl: tvlAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};

// ---- POST /api/ecosystem/projects ----
// Public submission — created with status "pending" until an admin approves it.
export const createProject = async (req, res) => {
  try {
    const { name, description, logoUrl, category, website, twitter, tvl, submittedBy } = req.body;

    if (!name || !description || !category || !website) {
      return res.status(400).json({
        success: false,
        error: "name, description, category and website are required",
      });
    }

    const project = await EcosystemProject.create({
      name,
      description,
      logoUrl,
      category,
      website,
      twitter,
      tvl: tvl ?? null,
      submittedBy,
      status: "pending",
    });

    return res.status(201).json({ success: true, project });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: "A project with this name already exists" });
    }
    console.error("createProject error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit project" });
  }
};

// ---- PATCH /api/ecosystem/projects/:id ----
// Admin-only in production — protect this route with auth middleware.
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await EcosystemProject.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    return res.json({ success: true, project });
  } catch (err) {
    console.error("updateProject error:", err);
    return res.status(500).json({ success: false, error: "Failed to update project" });
  }
};

// ---- DELETE /api/ecosystem/projects/:id ----
// Admin-only in production — protect this route with auth middleware.
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await EcosystemProject.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    return res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error("deleteProject error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete project" });
  }
};