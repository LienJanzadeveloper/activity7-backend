const router = require("express").Router();
const pool = require("../db");

const statuses = ["Pending", "In progress", "Completed"];

function validateFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }
  const fields = ["title", "category", "description", "status"];
  for (const field of fields) {
    if (typeof body[field] !== "string") return `${field} must be a string.`;
  }
  const title = body.title.trim();
  const category = body.category.trim();
  const description = body.description.trim();
  const status = body.status.trim();
  if (title.length < 3 || title.length > 80) return "Title must have 3 to 80 characters.";
  if (category.length < 2 || category.length > 40) return "Category must have 2 to 40 characters.";
  if (description.length < 5 || description.length > 300) return "Description must have 5 to 300 characters.";
  if (!statuses.includes(status)) return "Status must be Pending, In progress, or Completed.";
  return { title, category, description, status };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id,title,category,description,status FROM records ORDER BY id");
    res.status(200).json(result.rows);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID must be a positive whole number." });
  try {
    const result = await pool.query("SELECT id,title,category,description,status FROM records WHERE id=$1", [id]);
    if (!result.rowCount) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  const values = validateFields(req.body);
  if (typeof values === "string") return res.status(400).json({ message: values });
  try {
    const result = await pool.query(
      "INSERT INTO records (title,category,description,status) VALUES ($1,$2,$3,$4) RETURNING id,title,category,description,status",
      [values.title, values.category, values.description, values.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID must be a positive whole number." });
  const values = validateFields(req.body);
  if (typeof values === "string") return res.status(400).json({ message: values });
  try {
    const result = await pool.query(
      "UPDATE records SET title=$1,category=$2,description=$3,status=$4 WHERE id=$5 RETURNING id,title,category,description,status",
      [values.title, values.category, values.description, values.status, id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID must be a positive whole number." });
  try {
    const result = await pool.query("DELETE FROM records WHERE id=$1 RETURNING id", [id]);
    if (!result.rowCount) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (err) { next(err); }
});

module.exports = router;
