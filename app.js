const form = document.getElementById("fuelForm");
const table = document.getElementById("logTable");
const statsDiv = document.getElementById("stats");

let entries = JSON.parse(localStorage.getItem("fuelEntries")) || [];

function saveEntries() {
  localStorage.setItem("fuelEntries", JSON.stringify(entries));
}

function render() {
  table.innerHTML = "";

  let totalMiles = 0;
  let totalGallons = 0;
  let totalCost = 0;

  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const current = entries[i];

    const miles = current.odometer - prev.odometer;
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

  if (totalMiles > 0) {
    const avgMPG = totalMiles / totalGallons;
    const avgCostPerMile = totalCost / totalMiles;

    statsDiv.innerHTML = `
      <h3>Running Averages</h3>
      <p>Average MPG: ${avgMPG.toFixed(2)}</p>
      <p>Average Cost per Mile: $${avgCostPerMile.toFixed(3)}</p>
    `;
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const odometer = Number(document.getElementById("odometer").value);
  const gallons = Number(document.getElementById("gallons").value);
  const cost = Number(document.getElementById("cost").value);

  entries.push({
    date: new Date().toLocaleDateString(),
    odometer,
    gallons,
    cost
  });

  saveEntries();
  render();
  form.reset();
});

render();

