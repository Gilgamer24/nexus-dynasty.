const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');
let db = { users: {} };

// Chargement de la DB
if (fs.existsSync(DB_PATH)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
        console.log("Erreur lecture DB, reset...");
        db = { users: {} };
    }
}

function save() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error("Erreur sauvegarde :", e);
    }
}

let players = {};

// TOUT le code lié aux joueurs doit être ICI
io.on('connection', (socket) => {
    console.log(`Nouveau joueur connecté : ${socket.id}`);

    socket.on('login', (data) => {
        const pseudo = data.pseudo || "Inconnu";
        
        // Si l'utilisateur n'existe pas, on le crée avec les nouvelles stats
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, 
                gold: 1000, 
                wood: 0, 
                stone: 0,
                hp: 100, 
                hunger: 100,
                axeLvl: 1, 
                swordLvl: 1,
                house: { lvl: 1, x: 0, z: 0, built: false, storage: 0, workers: 0 }
            };
            save();
        }

        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo, x: 0, z: 0 };

        // Envoi des données au joueur
        socket.emit('initData', { me: db.users[pseudo] });
        
        // On prévient les autres
        socket.broadcast.emit('playerUpdate', players[socket.id]);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            socket.broadcast.emit('playerUpdate', players[socket.id]);
        }
    });

    socket.on('updatePlayer', (data) => {
        if (socket.userId && db.users[socket.userId]) {
            db.users[socket.userId] = data;
            save();
        }
    });

    socket.on('disconnect', () => {
        console.log(`Joueur déconnecté : ${socket.id}`);
        socket.broadcast.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur Nexus Dynasty en ligne sur le port ${PORT}`);
});
