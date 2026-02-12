const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    // Un joueur rejoint avec son pseudo et ses stats sauvegardées
    socket.on('joinGame', (userData) => {
        players[socket.id] = {
            id: socket.id,
            pseudo: userData.pseudo || "Nomade",
            gold: userData.gold || 100,
            food: userData.food || 100,
            hp: 100,
            x: 0, y: 0, z: 0, ry: 0,
            color: Math.floor(Math.random() * 0xffffff)
        };
        
        socket.emit('initPlayer', players[socket.id]);
        io.emit('updatePlayerList', players);
    });

    socket.on('move', (data) => {
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

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Serveur Nexus actif sur port ${PORT}`));
