const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let db = { 
    users: {}, 
    globalHouses: [] 
};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, gold: 0, food: 100, hp: 100, 
                houses: [], tutoStep: 0 
            };
        }
        socket.userId = pseudo;
        // Envoi des données initiales et des bâtiments existants
        socket.emit('authSuccess', {
            user: db.users[pseudo],
            houses: db.globalHouses
        });
    });

    socket.on('buildGlobal', (houseData) => {
        db.globalHouses.push(houseData);
        io.emit('newHouse', houseData);
    });

    socket.on('updateStats', (s) => {
        if(socket.userId && s) {
            db.users[socket.userId].gold = Number(s.gold) || 0;
            db.users[socket.userId].food = Number(s.food) || 0;
            db.users[socket.userId].hp = Number(s.hp) || 0;
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`Serveur Nexus Logistique sur http://localhost:${PORT}`));
