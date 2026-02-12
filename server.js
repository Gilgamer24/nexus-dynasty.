const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname)); 

let players = {};

io.on('connection', (socket) => {
    // 1. Créer le nouveau joueur avec une couleur aléatoire
    players[socket.id] = {
        x: 0, y: 0, z: 0, ry: 0,
        id: socket.id,
        color: Math.floor(Math.random() * 0xffffff)
    };

    // 2. Envoyer la liste de TOUS les joueurs au nouveau
    socket.emit('currentPlayers', players);
    
    // 3. Prévenir les autres qu'un nouveau arrive
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // 4. Mettre à jour et diffuser les mouvements
    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].z = data.z;
            players[socket.id].ry = data.ry;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Serveur actif sur port ${PORT}`));
