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
    CREATE INDEX IF NOT EXISTS idx_fuel_entries_id ON fuel_entries(id);
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

  if (!date || !odometer || !gallons || !cost) {
    return res.status(400).json({ error: "Missing required fields" });
    }

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

// DELETE entry
app.delete("/api/entries/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM fuel_entries WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.get("/api/analytics/monthly", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM fuel_entries
      ORDER BY odometer ASC
    `);

    const entries = result.rows;

    if (entries.length < 2) {
      return res.json({});
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyMiles = 0;
    let monthlyGallons = 0;
    let monthlyCost = 0;
    let ytdCost = 0;

    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const current = entries[i];

      const entryDate = new Date(current.date);
      const miles = current.odometer - prev.odometer;

      if (miles <= 0) continue;

      if (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      ) {
        monthlyMiles += miles;
        monthlyGallons += Number(current.gallons);
        monthlyCost += Number(current.cost);
      }

      if (entryDate.getFullYear() === currentYear) {
        ytdCost += Number(current.cost);
      }
    }

    const monthlyMPG =
      monthlyGallons > 0 ? monthlyMiles / monthlyGallons : 0;

    res.json({
      monthlyMiles,
      monthlyCost,
      monthlyMPG,
      ytdCost
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});