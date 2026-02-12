const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Base de données temporaire (se vide au redémarrage du serveur)
let db = { users: {} };

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        if (db.users[pseudo]) {
            if (db.users[pseudo].mdp !== mdp) return socket.emit('authError', "Mauvais mot de passe !");
        } else {
            // Création automatique
            db.users[pseudo] = { 
                pseudo, mdp, gold: 500, food: 100, hp: 100,
                inv: [], zone: 'farm', pos: {x:0, y:0, z:0} 
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', db.users[pseudo]);
        io.emit('updatePlayers', db.users);
    });

    socket.on('move', (pos) => {
        if(socket.userId && db.users[socket.userId]) {
            db.users[socket.userId].pos = pos;
            socket.broadcast.emit('pMoved', { id: socket.userId, pos });
        }
    });

    socket.on('teleport', (zone) => {
        if(socket.userId) db.users[socket.userId].zone = zone;
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));
