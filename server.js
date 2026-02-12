const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Simulation de base de données (À remplacer par MongoDB pour du long terme)
let db = {
    users: {}, // { pseudo: { mdp, gold, food, inv, plots } }
    buildings: []
};

io.on('connection', (socket) => {
    // SYSTÈME DE COMPTE
    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        if (db.users[pseudo]) {
            if (db.users[pseudo].mdp === mdp) {
                socket.emit('authSuccess', db.users[pseudo]);
            } else {
                socket.emit('authError', "Mot de passe incorrect !");
                return;
            }
        } else {
            // Création de compte
            db.users[pseudo] = { 
                pseudo, mdp, gold: 1000, food: 100, 
                inv: [], plots: 1, zone: 'farm' 
            };
            socket.emit('authSuccess', db.users[pseudo]);
        }
        socket.userId = pseudo;
    });

    // TÉLÉPORTATION
    socket.on('teleport', (zone) => {
        if(socket.userId) {
            db.users[socket.userId].zone = zone;
            io.emit('playerMovedZone', { id: socket.id, zone: zone });
        }
    });

    // SYSTÈME DE DUEL (PVP)
    socket.on('challenge', (targetId) => {
        io.to(targetId).emit('duelRequest', { from: socket.id, bet: 500 });
    });

    socket.on('disconnect', () => {
        delete db.users[socket.userId];
    });
});

http.listen(3000, () => console.log("Nexus Dynastie v3.0 - Sécurisé"));
