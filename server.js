const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    console.log('Nouvelle Dynastie : ' + socket.id);

    // Initialisation du compte joueur
    players[socket.id] = {
        id: socket.id,
        name: "Maison " + socket.id.substring(0, 4),
        x: Math.random() * 20 - 10,
        y: 0,
        z: Math.random() * 20 - 10,
        ry: 0,
        color: Math.floor(Math.random() * 0xffffff),
        resources: { gold: 100, metal: 50, food: 50 },
        buildings: { mine: 1, farm: 1, barracks: 0 },
        army: 0
    };

    socket.emit('init', players[socket.id]);
    io.emit('currentPlayers', players);

    // Boucle de Simulation (Production toutes les 2 secondes)
    const gameLoop = setInterval(() => {
        if (players[socket.id]) {
            let p = players[socket.id];
            p.resources.gold += p.buildings.mine * 2;
            p.resources.food += p.buildings.farm * 2;
            socket.emit('updateResources', p.resources);
        } else {
            clearInterval(gameLoop);
        }
    }, 2000);

    // Logique de construction
    socket.on('build', (type) => {
        let p = players[socket.id];
        const costs = { mine: 50, farm: 50, barracks: 150 };
        if (p.resources.gold >= costs[type]) {
            p.resources.gold -= costs[type];
            p.buildings[type]++;
            socket.emit('updateResources', p.resources);
            socket.emit('msg', `Construction réussie : ${type} niveau ${p.buildings[type]}`);
        } else {
            socket.emit('msg', "Or insuffisant !");
        }
    });

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
http.listen(PORT, () => console.log(`Nexus Dynasty lancé sur le port ${PORT}`));
