const form = document.getElementById("fuelForm");
const table = document.getElementById("logTable");
const statsDiv = document.getElementById("stats");

let entries = [];

// Fetch entries from backend
async function fetchEntries() {
  const res = await fetch("/api/entries");
  entries = await res.json();
  render();
}

// Render table + stats
function render() {
  table.innerHTML = "";

  if (entries.length < 2) {
    statsDiv.innerHTML = "<p>Add at least two fill-ups to calculate MPG.</p>";
    return;
  }

  let totalMiles = 0;
  let totalGallons = 0;
  let totalCost = 0;

  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const current = entries[i];

    const miles = current.odometer - prev.odometer;
    if (miles <= 0) continue;

    const mpg = miles / current.gallons;
    const costPerMile = current.cost / miles;

    totalMiles += miles;
    totalGallons += current.gallons;
    totalCost += current.cost;

    const row = `
      <tr>
        <td>${current.date}</td>
        <td>${current.odometer}</td>
        <td>${mpg.toFixed(2)}</td>
        <td>$${costPerMile.toFixed(3)}</td>
      </tr>
    `;

    table.innerHTML += row;
  }

  const avgMPG = totalMiles / totalGallons;
  const avgCostPerMile = totalCost / totalMiles;

  statsDiv.innerHTML = `
    <h3>Running Averages</h3>
    <p><strong>Average MPG:</strong> ${avgMPG.toFixed(2)}</p>
    <p><strong>Average Cost per Mile:</strong> $${avgCostPerMile.toFixed(3)}</p>
  `;
}

// Submit new entry
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const entry = {
    date: new Date().toLocaleDateString(),
    odometer: Number(document.getElementById("odometer").value),
    gallons: Number(document.getElementById("gallons").value),
    cost: Number(document.getElementById("cost").value)
  };

  await fetch("/api/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(entry)
  });

  form.reset();
  fetchEntries();
});

// Initial load
fetchEntries();
