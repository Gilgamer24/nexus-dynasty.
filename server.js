const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};
let buildings = []; // Liste globale des constructions

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = {
            id: socket.id,
            pseudo: data.pseudo || "Nomade",
            gold: 100,
            food: 100,
            hp: 100,
            x: 0, y: 0, z: 0, ry: 0,
            color: Math.floor(Math.random() * 0xffffff)
        };
        socket.emit('init', { id: socket.id, players, buildings });
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('requestBuild', (type) => {
        const p = players[socket.id];
        const cost = type === 'farm' ? 50 : 80;
        if (p && p.gold >= cost) {
            p.gold -= cost;
            const newBuilding = { 
                id: Date.now(), 
                owner: socket.id, 
                type: type, 
                x: p.x + (Math.random() * 6 - 3), 
                z: p.z + (Math.random() * 6 - 3) 
            };
            buildings.push(newBuilding);
            io.emit('buildingPlaced', newBuilding);
            io.to(socket.id).emit('updateStats', { gold: p.gold, food: p.food });
        }
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerQuit', socket.id);
    });
});

// Boucle économique : + Or et - Faim
setInterval(() => {
    Object.keys(players).forEach(id => {
        const p = players[id];
        const playerBuildings = buildings.filter(b => b.owner === id);
        
        // Bonus par bâtiment
        const goldGain = playerBuildings.filter(b => b.type === 'mine').length * 5;
        const foodGain = playerBuildings.filter(b => b.type === 'farm').length * 5;
        
        p.gold += goldGain;
        p.food = Math.max(0, p.food + foodGain - 2); // Consommation naturelle
        
        if (p.food <= 0) p.hp -= 5;
        
        io.to(id).emit('updateStats', { gold: p.gold, food: p.food, hp: p.hp });
    });
}, 5000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Nexus Server v2.0 Online"));
