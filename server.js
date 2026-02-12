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
            // Initialisation stricte pour éviter les erreurs de calcul
            db.users[pseudo] = { 
                pseudo, mdp, gold: 500, food: 100, hp: 100, workersCount: 0 
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', db.users[pseudo]);
    });

    socket.on('updateStats', (s) => {
        if(socket.userId && s) {
            // Sécurité anti-bug : on vérifie que ce sont des nombres
            db.users[socket.userId].gold = Number(s.gold) || 0;
            db.users[socket.userId].food = Number(s.food) || 0;
            db.users[socket.userId].hp = Number(s.hp) || 0;
        }
    });

    socket.on('move', (pos) => {
        if(socket.userId) socket.broadcast.emit('pMoved', { id: socket.userId, pos });
    });
});

http.listen(3000, () => console.log("Nexus Server v5: Economic Revolution"));
