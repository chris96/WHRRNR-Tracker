const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS fuel_entries (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    odometer INTEGER NOT NULL,
    gallons NUMERIC NOT NULL,
    cost NUMERIC NOT NULL
  );
`);

// GET entries
app.get("/api/entries", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM fuel_entries ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST entry
app.post("/api/entries", async (req, res) => {
  const { date, odometer, gallons, cost } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO fuel_entries (date, odometer, gallons, cost) VALUES ($1, $2, $3, $4) RETURNING *",
      [date, odometer, gallons, cost]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});