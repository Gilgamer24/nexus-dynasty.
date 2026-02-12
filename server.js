const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    socket.on('join', (userData) => {
        players[socket.id] = {
            id: socket.id,
            pseudo: userData.pseudo || "Nomade",
            x: 0, y: 0, z: 0,
            hp: 100, food: 100, gold: userData.gold || 100,
            color: Math.floor(Math.random() * 0xffffff)
        };
        socket.emit('init', players[socket.id]);
        io.emit('currentPlayers', players);
    });

    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

http.listen(3000, () => console.log("Serveur Nexus Voyage lancé !"));
