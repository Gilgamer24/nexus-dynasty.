const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Base de données simplifiée pour la session
let db = { users: {} };

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo, mdp } = data;
        // Si l'utilisateur n'existe pas, on le crée avec des valeurs de base propres
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, 
                mdp, 
                gold: 200, 
                food: 100, 
                hp: 100, 
                workersCount: 0 
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', db.users[pseudo]);
    });

    // Sauvegarde des stats envoyées par le client
    socket.on('updateStats', (stats) => {
        if (socket.userId) {
            db.users[socket.userId] = stats;
        }
    });

    socket.on('move', (pos) => {
        if (socket.userId) {
            socket.broadcast.emit('pMoved', { id: socket.userId, pos });
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`Serveur Nexus actif sur http://localhost:${PORT}`));
