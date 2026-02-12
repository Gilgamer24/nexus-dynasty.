const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

// Base de données en mémoire (Pseudo + MDP + Ressources)
let db = { users: {} };

io.on('connection', (socket) => {
    console.log('Un souverain se connecte...');

    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        if (db.users[pseudo]) {
            if (db.users[pseudo].mdp !== mdp) {
                return socket.emit('authError', "Mot de passe incorrect !");
            }
        } else {
            // Premier compte : on offre 1000 pièces
            db.users[pseudo] = { 
                pseudo, mdp, gold: 1000, food: 100, hp: 100, 
                inv: [], zone: 'farm', pos: {x:0, y:0, z:0} 
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', db.users[pseudo]);
    });

    // Gestion de la mort : Taxe de 40%
    socket.on('requestRespawn', () => {
        if(socket.userId && db.users[socket.userId]) {
            let u = db.users[socket.userId];
            u.gold = Math.floor(u.gold * 0.6); // Perte de 40%
            u.hp = 100;
            u.food = 100;
            u.pos = {x:0, y:0, z:0};
            socket.emit('respawnDone', u);
        }
    });

    socket.on('move', (pos) => {
        if(socket.userId && db.users[socket.userId]) {
            db.users[socket.userId].pos = pos;
            socket.broadcast.emit('playerMoved', { id: socket.userId, pos });
        }
    });

    socket.on('updateStats', (stats) => {
        if(socket.userId && db.users[socket.userId]) {
            db.users[socket.userId].hp = Math.max(0, stats.hp);
            db.users[socket.userId].gold = stats.gold;
        }
    });

    socket.on('disconnect', () => {
        console.log('Déconnexion');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Nexus Dynasty v4.0 sur le port ${PORT}`));
