const ctx = document.getElementById('myChart').getContext('2d');
const timeunits = 7;
let fluctuationFactor = 1.;
let chart = new Chart(ctx, {
    type: 'line',

    data: {
        labels: [...Array(timeunits).keys()],
        datasets: [],
    },
    options: {},
});

let timerTotal = 10;
let timerRed = 0;
let timeleft = 0;

let memory = [{data: [0]}];
const socket = io('/client');
const adminSocket = io(key);

socket.on('newdata', ([datasets, ]) => {
    updateChart(datasets);
    updateTiles(datasets);
    updateTable(datasets);
    memory = [...datasets];
});

socket.on('stockdata', (datasets) => {
    if (memory[0].data.slice(-1) !== datasets[0].data.slice(-1)) {
        updateChart(datasets);
        updateTiles(datasets);
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

function updateTiles(input) {
    let items = document.getElementById('items');
    let child = items.lastElementChild;
    while (child) {
        items.removeChild(child);
        child = items.lastElementChild;
    }
    for (let {label, borderColor, data, lineTension} of input) {
        addItem(label, borderColor, data.slice(-1))
    }
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

if($("#fluctSlider").length) {
    var fluctSlider = document.getElementById("fluctSlider");
    var fluctp = document.getElementById("fluct");
    fluctuationFactor = parseInt(fluctSlider.value) / 100;
    fluctp.innerHTML = fluctuationFactor.toString();

    fluctSlider.oninput = () => {
        fluctuationFactor = parseInt(fluctSlider.value) / 100;
        fluctp.innerHTML = fluctuationFactor.toString();
        adminSocket.emit('fluct', fluctuationFactor.toString());
    };
}

function addItem(name, color, price) {
    let container = document.createElement("div");
    let button = document.createElement("button");
    container.appendChild(button);
    container.classList.add("col-md-3", "col-sm-6",);
    button.classList.add("btn", "btn-primary");
    button.appendChild(document.createTextNode(`${name.substring(0, 12)} : ${price} € `));
    button.setAttribute("data-toggle", "modal");
    button.setAttribute("data-target", "#transaction");
    button.setAttribute("data-price", `${price}`);
    button.setAttribute("data-name", `${name}`);
    document.getElementById('items').appendChild(container);
}

function addTableData(name, price) {
    let row = document.createElement("tr");
    row.classList.add('clickrow');
    let th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.appendChild(document.createTextNode(`${name}`));
    row.appendChild(th);
    let [td1, td2, td3] = [document.createElement("td"), document.createElement("td"), document.createElement("td")];
    td1.appendChild(document.createTextNode(`${price.slice(-1)} €`));
    let diff = Math.round((price.slice(-1) - price.slice(-2, -1) + Number.EPSILON) * 100) / 100;
    td2.appendChild(document.createTextNode(`${diff}`));
    row.appendChild(td1);
    row.appendChild(td2);
    if($('#options').length){
        let button = document.createElement("button");
        button.classList.add("btn", "btn-info");
        button.appendChild(document.createTextNode("Options"));
        button.setAttribute("data-toggle", "modal");
        button.setAttribute("data-target", "#delete");
        button.setAttribute("data-name", `${name}`);
        td3.appendChild(button);
        row.appendChild(td3);
    }
    document.getElementById('tableData').appendChild(row);
}

$('#transaction').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    let name = button.data('name'); // Extract info from data-* attributes
    let price = button.data('price'); // Extract info from data-* attributes
    var modal = $(this);
    modal.find('#TransactionTitle').text(`Transaction: ${name}`);
    modal.find('#TransactionDate').text(Date());
    modal.find('#TransactionName').text(name);
    modal.find('#TransactionPrice').text(price);
});

$('#successTransaction').click((event) => {
    let transac = [$('#TransactionName'), $('#TransactionPrice'), $('#TransactionDate')].map(v => v.text());
    adminSocket.emit('transaction', transac)
});

$('#addItem').click((event) => {
    const rawForm = $('#addForm');
    let form = rawForm.serializeArray();
    rawForm.trigger("reset");
    adminSocket.emit("add", form);
});

$('#addToggle').click((event) => {
    $('#addContainer').toggle();
});

$(".clickrow").on("click", (event) => {
    var tr = $(event.relatedTarget); // Button that triggered the modal
});

$('#start').click((event) => {
    adminSocket.emit("command", true);
});

$('#stop').click((event) => {
    adminSocket.emit("command", false);
});

$('#delete').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    let name = button.data('name'); // Extract info from data-* attributes
    var modal = $(this);
    modal.find('#DeleteTitle').text(`Supprimer: ${name}`);
    modal.find('#DeleteName').val(name);
});

$('#successDelete').click((event) => {
    const deleteId = $('#DeleteName').val();
    adminSocket.emit('delete', deleteId);
    adminSocket.emit('delete', deleteId);
});

$('#addOverride').click((event) => {
    let form = $('#manualOverride').serializeArray();
    adminSocket.emit("override", [form[0].value, form[1].value]);
});

