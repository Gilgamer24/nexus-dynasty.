const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let db = { 
    users: {}, 
    buildings: [] // Stocke les constructions de tout le monde
};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { pseudo, mdp, gold: 1000, food: 100, hp: 100, zone: 'farm' };
        } else if (db.users[pseudo].mdp !== mdp) {
            return socket.emit('authError', "MDP Incorrect");
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', { user: db.users[pseudo], buildings: db.buildings });
    });

    socket.on('build', (bData) => {
        if (socket.userId && db.users[socket.userId].gold >= bData.cost) {
            db.users[socket.userId].gold -= bData.cost;
            const newBuilding = { ...bData, id: Date.now(), owner: socket.userId };
            db.buildings.push(newBuilding);
            io.emit('newBuilding', newBuilding);
            socket.emit('updateGold', db.users[socket.userId].gold);
        }
    });

    socket.on('requestRespawn', () => {
        if(socket.userId) {
            db.users[socket.userId].gold = Math.floor(db.users[socket.userId].gold * 0.6);
            db.users[socket.userId].hp = 100;
            socket.emit('respawnDone', db.users[socket.userId]);
        }
    });

    socket.on('move', (pos) => {
        if(socket.userId) socket.broadcast.emit('pMoved', { id: socket.userId, pos });
    });
});

http.listen(3000, () => console.log("Nexus Server Ready"));
