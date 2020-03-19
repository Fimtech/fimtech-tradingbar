const ctx = document.getElementById('myChart').getContext('2d');
const timeunits = 7;
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [...Array(timeunits).keys()].map(v => ''),
        datasets: [],
    },
    options: {},
});

let timerTotal = 10;
let timerRed = 0;
let timeleft = 0;

let memory = [{data: [0]}];
const socket = io('/client');

socket.on('newdata', (datasets) => {
    updateChart(datasets);
    updateTable(datasets);
    memory = [...datasets];
});

socket.on('stockdata', (datasets) => {
    if (memory[0].data.slice(-1) !== datasets[0].data.slice(-1)) {
        updateChart(datasets);
        updateTable(datasets);
        memory = [...datasets];
    }
});

socket.on('timer', ([t, timerDuration, timerRedDuration]) => {
    timerTotal = timerDuration;
    timerRed = timerRedDuration;
    timeleft = t;
    document.getElementById("progressBar").style.width = `${((timerTotal - timeleft) / timerTotal * 100)}%`;
    document.getElementById("progressBarText").innerText = `${timeleft}`;
    if (timeleft <= timerRed) {
        document.getElementById("progressBar").classList.add("bg-danger");
    } else {
        document.getElementById("progressBar").classList.remove("bg-danger");
    }
});

function updateChart(input) {
    chart.config.data.datasets = input;
    chart.update(0);
}

function updateTable(input) {
    let items = document.getElementById('tableData');
    let child = items.lastElementChild;
    while (child) {
        items.removeChild(child);
        child = items.lastElementChild;
    }
    for (let {label, borderColor, data, lineTension} of input) {
        addTableData(label, data)
    }
}

function addTableData(name, price) {
    let row = document.createElement("tr");
    let th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.appendChild(document.createTextNode(`${name}`));
    row.appendChild(th);
    let [td1, td2] = [document.createElement("td"), document.createElement("td")];
    td1.appendChild(document.createTextNode(`${price.slice(-1)} €`));
    let diff = Math.round((price.slice(-1) - price.slice(-2, -1) + Number.EPSILON) * 100) / 100;
    td2.appendChild(document.createTextNode(`${diff}`));
    row.appendChild(td1);
    row.appendChild(td2);
    document.getElementById('tableData').appendChild(row);
}

