const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static(__dirname));

let db = { users: {}, globalHouses: [] }; // globalHouses pour le multi
const DB_PATH = './database.json';

if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH)); } catch (e) { console.log("Erreur DB"); }
}

function save() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

let players = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const pseudo = data.pseudo;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { pseudo, gold: 300, food: 100, oreStock: 0 };
        }
        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo, x: 0, z: 0 };
        
        // Envoyer l'état actuel au nouveau joueur
        socket.emit('initData', { 
            me: db.users[pseudo], 
            houses: db.globalHouses,
            players: players 
        });
        
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    socket.on('move', (pos) => {
        if(players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].z = pos.z;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('newHouse', (houseData) => {
        db.globalHouses.push(houseData);
        io.emit('houseBuilt', houseData); // Tout le monde voit la maison
        save();
    });

    socket.on('updatePlayer', (data) => {
        if(socket.userId) {
            db.users[socket.userId] = data;
            save();
        }
    });

    socket.on('disconnect', () => {
        io.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

http.listen(3000, () => console.log("Nexus Dynasty X6 - Online"));
