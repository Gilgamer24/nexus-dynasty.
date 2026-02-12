const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let db = { users: {}, buildings: [] };

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, mdp, gold: 200, food: 100, hp: 100, 
                workers: 0, lastUpdate: Date.now() 
            };
        } else if (db.users[pseudo].mdp !== mdp) {
            return socket.emit('authError', "Mauvais mot de passe");
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', { user: db.users[pseudo], buildings: db.buildings });
    });

    // Production automatique des mineurs
    socket.on('buyWorker', () => {
        let u = db.users[socket.userId];
        if (u && u.gold >= 100) {
            u.gold -= 100;
            u.workers += 1;
            socket.emit('updateStats', u);
        }
    });

    socket.on('requestRespawn', () => {
        if(socket.userId) {
            let u = db.users[socket.userId];
            u.gold = Math.floor(u.gold * 0.6);
            u.hp = 100; u.food = 100;
            socket.emit('respawnDone', u);
        }
    });

    socket.on('move', (pos) => {
        if(socket.userId) socket.broadcast.emit('pMoved', { id: socket.userId, pos });
    });
});

http.listen(3000, () => console.log("Nexus Economy Engine Ready"));
