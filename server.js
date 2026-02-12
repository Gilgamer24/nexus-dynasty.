const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Base de données en mémoire (pour une persistance après redémarrage serveur, il faudrait un fichier JSON ou MongoDB)
let db = { 
    users: {} 
};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, gold: 50, food: 100, hp: 100, oreStock: 0,
                houses: [] // Liste des positions {x, z}
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', db.users[pseudo]);
    });

    // Sauvegarde les stats et les maisons
    socket.on('saveAll', (data) => {
        if(socket.userId) {
            db.users[socket.userId] = data;
        }
    });

    // Gestion du respawn (Reset stats mais garde les maisons)
    socket.on('respawnRequest', () => {
        if(socket.userId) {
            let u = db.users[socket.userId];
            u.hp = 100; u.food = 100; u.gold = 0; u.oreStock = 0;
            socket.emit('authSuccess', u);
        }
    });
});

http.listen(3000, () => console.log("Nexus Server v8 - Persistance Active"));
