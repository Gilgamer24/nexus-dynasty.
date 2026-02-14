const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');
let db = { users: {} };

if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { console.log("DB vide."); }
}

function save() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

let players = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const pseudo = data.pseudo || "Inconnu";
        if (!db.users[pseudo]) {
            const plotID = (Object.keys(db.users).length % 8) + 1;
            db.users[pseudo] = { 
                pseudo, gold: 500, wood: 0, oreStock: 0, 
                plotID, privateHouses: [], workersCount: 0,
                hp: 100, hunger: 100, hasSword: false, plans: 0
            };
            save();
        }
        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo, x: 0, z: 0 };
        socket.emit('initData', { me: db.users[pseudo] });
        io.emit('playerUpdate', players[socket.id]);
    });

    socket.on('move', (data) => {
        if(players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            socket.broadcast.emit('playerUpdate', players[socket.id]);
        }
    });

    socket.on('updatePlayer', (data) => {
        if(socket.userId) { db.users[socket.userId] = data; save(); }
    });

    socket.on('disconnect', () => {
        io.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Dynasty Server Running on ${PORT}`));
// ... (garder le début du fichier précédent)
socket.on('login', (data) => {
    const pseudo = data.pseudo || "Inconnu";
    if (!db.users[pseudo]) {
        db.users[pseudo] = { 
            pseudo, gold: 1000, wood: 0, stone: 0,
            hp: 100, hunger: 100,
            axeLvl: 1, swordLvl: 1,
            house: { lvl: 1, x: 0, z: 0, built: false, storage: 0, workers: 0 }
        };
        save();
    }
    // ... reste du login
});
