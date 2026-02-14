const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');
let db = { users: {}, globalHouses: [] };

// Chargement sécurisé
if (fs.existsSync(DB_PATH)) {
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        if (raw) db = JSON.parse(raw);
        console.log("✅ Base de données chargée.");
    } catch (e) { console.log("⚠️ Fichier DB corrompu, reset."); }
}

function save() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log("💾 Sauvegarde disque réussie.");
}

let players = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const pseudo = data.pseudo || "Joueur";
        if (!db.users[pseudo]) {
            db.users[pseudo] = { pseudo, gold: 500, food: 100, oreStock: 0 };
        }
        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo, x: 0, z: 0 };
        
        socket.emit('initData', { 
            me: db.users[pseudo], 
            houses: db.globalHouses,
            players: players 
        });
        socket.broadcast.emit('playerJoined', players[socket.id]);
        save();
    });

    socket.on('move', (pos) => {
        if(players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].z = pos.z;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('newHouse', (houseData) => {
        db.globalHouses.push(houseData);
        io.emit('houseBuilt', houseData);
        save();
    });

    socket.on('updatePlayer', (data) => {
        if(socket.userId) {
            db.users[socket.userId] = data;
            save();
        }
    });

    socket.on('disconnect', () => {
        io.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
