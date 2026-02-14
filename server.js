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
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {} }; }
}

function save() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

let activePlayers = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const p = data.pseudo || "Lord_" + Math.floor(Math.random()*999);
        if (!db.users[p]) {
            db.users[p] = { 
                pseudo: p, gold: 1000, wood: 0, stone: 0, hp: 100, hunger: 100,
                lvl: 1, axe: 1, sword: 1, house: { built: false, x: 0, z: 0, lvl: 1, workers: 0 }
            };
            save();
        }
        socket.userId = p;
        activePlayers[socket.id] = { id: socket.id, pseudo: p, x: 0, z: 0, color: Math.random() * 0xffffff };
        
        socket.emit('initData', { me: db.users[p], others: activePlayers });
        socket.broadcast.emit('newPlayer', activePlayers[socket.id]);
    });

    socket.on('move', (data) => {
        if(activePlayers[socket.id]) {
            activePlayers[socket.id].x = data.x;
            activePlayers[socket.id].z = data.z;
            socket.broadcast.emit('playerMove', activePlayers[socket.id]);
        }
    });

    socket.on('updatePlayer', (data) => {
        if (socket.userId) { db.users[socket.userId] = data; save(); }
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('playerQuit', socket.id);
        delete activePlayers[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`🚀 Nexus Dynasty V4 Online on ${PORT}`));
