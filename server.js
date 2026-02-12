const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {}; 
let db = { users: {} };

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, gold: 100, food: 100, hp: 100, oreStock: 0, houses: [] 
            };
        }
        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo: pseudo, x: 0, z: 0 };
        socket.emit('authSuccess', { me: db.users[pseudo], allPlayers: players });
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    socket.on('move', (pos) => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].z = pos.z;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('saveAll', (data) => {
        if(socket.userId) db.users[socket.userId] = data;
    });

    socket.on('disconnect', () => {
        io.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

http.listen(3000, () => console.log("Nexus Texture Engine Online"));
