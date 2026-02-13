const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');
let db = { users: {}, globalHouses: [] };

// CHARGEMENT INITIAL
if (fs.existsSync(DB_PATH)) {
    try {
        const rawData = fs.readFileSync(DB_PATH);
        db = JSON.parse(rawData);
        console.log("✅ Base de données chargée !");
    } catch (e) {
        console.log("⚠️ Erreur lecture DB, on repart à zéro.");
    }
} else {
    fs.writeFileSync(DB_PATH, JSON.stringify(db));
    console.log("📝 Fichier database.json créé !");
}

function save() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log("💾 Progression sauvegardée sur le disque.");
    } catch (e) {
        console.error("❌ Erreur de sauvegarde :", e);
    }
}

let players = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const pseudo = data.pseudo;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { pseudo, gold: 300, food: 100, oreStock: 0 };
            save();
        }
        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo, x: 0, z: 0 };
        
        socket.emit('initData', { 
            me: db.users[pseudo], 
            houses: db.globalHouses,
            players: players 
        });
        socket.broadcast.emit('playerJoined', players[socket.id]);
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
http.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
