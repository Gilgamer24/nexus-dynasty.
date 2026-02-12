const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let players = {};

io.on('connection', (socket) => {
    // Créer un nouveau joueur
    players[socket.id] = {
        x: 0, y: 0, z: 0, ry: 0,
        id: socket.id,
        color: Math.floor(Math.random() * 0xffffff)
    };

    // Envoyer la liste à l'arrivant
    socket.emit('currentPlayers', players);
    // Prévenir les autres
    socket.broadcast.emit('newPlayer', players[socket.id]);

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

http.listen(3000, () => { console.log('Serveur sur port 3000'); });
