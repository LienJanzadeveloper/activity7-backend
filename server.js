require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const recordsRouter = require("./routes/records");

const app = express();
const origins = (process.env.CLIENT_ORIGINS || "*")
  .split(",").map(v => v.trim()).filter(Boolean);

app.use(cors({ origin: origins.includes("*") ? "*" : origins }));
app.use(express.json());

app.get("/", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>IT Support Desk API Guide</title>
<style>body{font:16px system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#172033}
h1{color:#1259a8}table{border-collapse:collapse;width:100%}td,th{padding:10px;border:1px solid #ddd;text-align:left}
code,pre{background:#f2f5f9;padding:8px;border-radius:6px}pre{overflow:auto}</style></head>
<body><h1>IT Support Desk API</h1><p>Activity 7 backend API for managing IT support requests.</p>
<p><b>Base URL:</b> ${base}</p><p><a href="/health">Health check</a> | <a href="/api/records">All records</a></p>
<h2>Routes</h2><table><tr><th>Method</th><th>Path</th><th>Purpose</th></tr>
<tr><td>GET</td><td>/</td><td>API guide</td></tr><tr><td>GET</td><td>/health</td><td>Server/database health</td></tr>
<tr><td>GET</td><td>/api/records</td><td>List records</td></tr><tr><td>GET</td><td>/api/records/:id</td><td>Get one record</td></tr>
<tr><td>POST</td><td>/api/records</td><td>Create record</td></tr><tr><td>PUT</td><td>/api/records/:id</td><td>Replace editable fields</td></tr>
<tr><td>DELETE</td><td>/api/records/:id</td><td>Delete record</td></tr></table>
<h2>Editable fields</h2><p>title (3–80 chars), category (2–40 chars), description (5–300 chars), status (Pending, In progress, Completed).</p>
<h2>POST/PUT JSON body</h2><pre>{
  "title": "Computer Lab Internet Failure",
  "category": "Network",
  "description": "Internet is unavailable in the computer laboratory.",
  "status": "Pending"
}</pre><p>Success: 200, 201. Errors: 400 invalid input, 404 missing route/record, 500 server error.
An idle hosted service may take a short time to start.</p></body></html>`);
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use("/api/records", recordsRouter);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));

app.use((error, req, res, next) => {
  console.error(error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON request body." });
  }
  res.status(500).json({ message: "Unexpected server error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS records (
      id SERIAL PRIMARY KEY,
      title VARCHAR(80) NOT NULL,
      category VARCHAR(40) NOT NULL,
      description VARCHAR(300) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('Pending','In progress','Completed'))
    )`);
    const count = await pool.query("SELECT COUNT(*) FROM records");
    if (Number(count.rows[0].count) === 0) {
      await pool.query(`INSERT INTO records (title,category,description,status) VALUES
        ('Laptop will not start','Hardware','The student laptop does not power on when the power button is pressed.','Pending'),
        ('Wi-Fi connection unstable','Network','Wi-Fi disconnects repeatedly in the computer lab.','In progress'),
        ('Printer paper jam','Printer','The department printer has a paper jam and cannot print.','Pending'),
        ('Software installation request','Software','Request installation of approved data analysis software.','Pending'),
        ('Projector not displaying','Hardware','The lecture room projector is not displaying the computer output.','Completed'),
        ('Password reset request','Account','A student needs assistance resetting their university account password.','Pending'),
        ('Keyboard keys not responding','Hardware','Several keys on a lab keyboard are not responding.','In progress'),
        ('Computer running slowly','Performance','A workstation takes a long time to start and open applications.','Pending')`);
      console.log("Seed records inserted.");
    }
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
});
