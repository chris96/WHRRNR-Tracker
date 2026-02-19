const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let entries = [];

app.get("/api/entries", (req, res) => {
  res.json(entries);
});

app.post("/api/entries", (req, res) => {
  const entry = req.body;
  entries.push(entry);
  res.status(201).json(entry);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
