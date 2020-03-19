const db = require('./models');
const app = require('./app');

const timeunits = 7;
const predtimestep = 3;
let fluctuationFactor = 1.;
let fluctuationOffset = 10;
let tendancyBalancer = 0;
let status = false;
const zero = [0, 0, 0, 0, 0, 0, 0];
let items = [];
const colors = ["#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
    "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
    "#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
    "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
    "#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
    "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
    "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
    "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",

    "#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
    "#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
    "#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
    "#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
    "#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C",
    "#83AB58", "#001C1E", "#D1F7CE", "#004B28", "#C8D0F6", "#A3A489", "#806C66", "#222800",
    "#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4", "#1E0200", "#5B4E51",
    "#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC", "#D0AC94", "#7ED379", "#012C58"];
const next = Array(predtimestep).map(v => Math.random());

function itemsVolume() {
    return items.reduce((acc, curr) => acc + curr.currentVolume, 0);
}

function round(num) {
    return Math.round((num + Number.EPSILON) * 10) / 10
}

function rand() {
    return round(Math.random())
}

function addItem(name, startPrice = 0, min = 0, max = 10) {
    items.push({
        name : name,
        price : [...zero].map((v) => rand() + startPrice),
        next : [...next].map(v => rand()),
        currentVolume : 1,
        override : 0,
        overriden: false,
        color : colors[items.length],
        minmax : [min, max],
    });
}

function randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function GMB(prices, volume, totalVolume, manualOverride, overriden, index, min, max) {
    if (manualOverride === 0) {
        let cp_prices = Array.from({length : prices.length}, (v, k) => prices[k] + fluctuationOffset);
        if(overriden) {
            cp_prices[cp_prices.length - 1] = cp_prices[cp_prices.length - 2];
            items[index].overriden = false;
        }
        const N = prices.length;
        const k = Array.from({length: N - 1}, (v, k) => (cp_prices[k + 1] - cp_prices[k]) / cp_prices[k]);
        const mu = k.reduce((acc, curr) => acc + curr, 0) / (N - 1);
        const sigma = Math.sqrt(k.reduce((acc, curr) => acc + ((curr - mu) ** 2), 0) / (N - 1));
        let result = [cp_prices[cp_prices.length - 1]];
        let filter = [];
        let b;
        do {
            b = Array.from({length : predtimestep}, () => (randn_bm() + Math.tanh((volume / totalVolume * 100 * items.length - 100)) * 1.5  + tendancyBalancer) * fluctuationFactor);
            result = [cp_prices[cp_prices.length - 1]];
            for (let i = 0; i < predtimestep; i++) {
                result.push(result[result.length - 1] * Math.exp(mu - sigma**2 / 2 + sigma * b[i]));
            }
            result.shift();
            result = result.map(v => round(v));
            filter = result.filter(v => round(v - fluctuationOffset) >= max || round(v - fluctuationOffset) <= min);
        } while (filter.length > 0);
        return Array.from({length : result.length}, (v, k) => round(result[k] - fluctuationOffset));
    } else {
        items[index].overriden = true;
        return [manualOverride, manualOverride, manualOverride];
    }
}

function stocks() {
    let i = 0;
    items.forEach(item => {
        item.price.push(GMB(item.price, item.currentVolume, itemsVolume(), item.override, item.overriden, i, item.minmax[0], item.minmax[1])[0]);
        item.override = 0;
        item.currentVolume = 1;
        i++;
    });
}

addItem("a");
addItem("b");
addItem("c");

let io;
let client;
let admin;

function init(server) {
    io = require('socket.io')(server);
    client = io.of("/client");
    admin = io.of(process.env.IO_SECRET);
    client.emit('newdata', items.map((v) => {
        return {
            label: v.name,
            borderColor: v.color,
            data: v.price.slice(-timeunits),
            lineTension : 0,
        }
    }));

    setInterval(function(){
        client.emit('timer', [timeleft, timerDuration, timeRedDuration]);
        client.emit('stockdata', items.map((v) => {
            return {
                label: v.name,
                borderColor: v.color,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                data: v.price.slice(-timeunits),
                lineTension : 0,
            }
        }));
    }, 1000);


    admin.on('connection', (socket) => {
        socket.on('fluct', (msg) => {
            fluctuationFactor = parseFloat(msg);
        });

        socket.on('transaction', ([name, price, time]) => {
            db.Log.create({
                name,
                price,
                time,
            });
            for (let i = 0; i < items.length; i++) {
                if(items[i].name === name) {
                    items[i].currentVolume++;
                }
            }
        });

        socket.on('add', (msg) => {
            addItem(msg[0].value, round(parseFloat(msg[1].value)), round(parseFloat(msg[2].value)), round(parseFloat(msg[3].value)));
        });

        socket.on('command', (msg) => {
            if (msg) {
                if(!status) {
                    start();
                    status = true;
                }
            } else {
                if(status) {
                    clearInterval(main);
                    status = false;
                }
            }
        });

        socket.on('delete', (msg) => {
            for (let i = 0; i < items.length; i++) {
                if(items[i].name === msg) {
                    items.splice(i,1);
                }
            }
        });

        socket.on('override', (msg) => {
            let [name, value] = msg;
            for (let i = 0; i < items.length; i++) {
                if(items[i].name === name) {
                    items[i].override = round(parseFloat(value));
                }
            }
        });
    });
}

let timerDuration = 10;
let timeRedDuration = 3;
let timeleft = timerDuration;
let main;

function timerSettings(timerTotal, timerRed) {
    timerDuration = timerTotal;
    timeRedDuration = timerRed;
    console.log(timerDuration, timeRedDuration);
}

function start() {
    main = setInterval(function(){
        if(timeleft <= 0){
            timeleft = timerDuration;
            stocks();
        }
        timeleft -= 1;
    }, 1000);
}


module.exports = {
    init,
    timerSettings,
};

