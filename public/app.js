const form = document.getElementById("fuelForm");
const table = document.getElementById("logTable");
const statsDiv = document.getElementById("stats");
const analyticsDiv = document.getElementById("analytics");

let entries = [];

// Fetch entries from backend
async function fetchEntries() {
  const res = await fetch("/api/entries");
  entries = await res.json();
  render();
  fetchAnalytics();
}

// Render table + stats
function render() {
  table.innerHTML = "";

  if (entries.length < 2) {
    statsDiv.innerHTML = `
      <h2 class="h5 fw-semibold mb-3">Running Averages</h2>
      <p class="text-secondary mb-0">Add at least two fill-ups to calculate MPG.</p>
    `;
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
    <h2 class="h5 fw-semibold mb-3">Running Averages</h2>
    <div class="metric-list">
      <div class="metric-item">
        <span class="metric-label">Average MPG</span>
        <span class="metric-value">${avgMPG.toFixed(2)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Average Cost per Mile</span>
        <span class="metric-value">$${avgCostPerMile.toFixed(3)}</span>
      </div>
    </div>
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

async function fetchAnalytics() {
  const res = await fetch("/api/analytics/monthly");
  const data = await res.json();

  if (!data.monthlyMiles) {
    analyticsDiv.innerHTML = `
      <h2 class="h5 fw-semibold mb-3">Monthly Summary</h2>
      <p class="text-secondary mb-0">No monthly analytics yet.</p>
    `;
    return;
  }

  analyticsDiv.innerHTML = `
    <h2 class="h5 fw-semibold mb-3">Monthly Summary</h2>
    <div class="metric-list">
      <div class="metric-item">
        <span class="metric-label">Miles Driven</span>
        <span class="metric-value">${data.monthlyMiles.toFixed(0)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Fuel Spend</span>
        <span class="metric-value">$${data.monthlyCost.toFixed(2)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Avg MPG</span>
        <span class="metric-value">${data.monthlyMPG.toFixed(2)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">YTD Fuel Spend</span>
        <span class="metric-value">$${data.ytdCost.toFixed(2)}</span>
      </div>
    </div>
  `;
}


// Initial load
fetchEntries();
