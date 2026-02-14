const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));
const DB_PATH = path.join(__dirname, 'database.json');

// Initialisation Base de données
let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
        db = { users: {} };
    }
}

function save() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Logique Serveur
io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const p = data.pseudo || "Joueur";
        if (!db.users[p]) {
            db.users[p] = { 
                pseudo: p, gold: 600, wood: 0, hp: 100, hunger: 100,
                axeLvl: 1, swordLvl: 1,
                house: { built: false, lvl: 1, storage: 0, workers: 0, x: 0, z: 0 }
            };
            save();
        }
        socket.userId = p;
        socket.emit('initData', { me: db.users[p] });
    });

    socket.on('updatePlayer', (data) => {
        if (socket.userId) {
            db.users[socket.userId] = data;
            save();
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Serveur actif sur le port ${PORT}`));
