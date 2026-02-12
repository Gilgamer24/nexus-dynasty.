const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let db = { users: {} };

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, mdp, gold: 0, food: 100, hp: 100, 
                workersCount: 0, houses: [], tutoStep: 0 
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', db.users[pseudo]);
    });

    socket.on('updateStats', (s) => {
        if(socket.userId && s) {
            db.users[socket.userId].gold = Number(s.gold) || 0;
            db.users[socket.userId].food = Number(s.food) || 0;
            db.users[socket.userId].hp = Number(s.hp) || 0;
        }
    });

    socket.on('saveBuild', (houseData) => {
        if(socket.userId) db.users[socket.userId].houses.push(houseData);
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`Serveur Nexus v6 tournant sur http://localhost:${PORT}`));
