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
let db = { users: {}, globalHouses: [] };

if (fs.existsSync(DB_PATH)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) { console.log("Init DB..."); }
}

function save() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) { console.error("Erreur save:", e); }
}

let players = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const pseudo = data.pseudo || "Joueur";
        if (!db.users[pseudo]) {
            const plotID = (Object.keys(db.users).length % 8) + 1;
            db.users[pseudo] = { 
                pseudo, gold: 500, wood: 0, oreStock: 0, 
                plotID, privateHouses: [], workersCount: 0 
            };
            save();
        }
        socket.userId = pseudo;
        players[socket.id] = { id: socket.id, pseudo, x: 0, z: 0, plotID: db.users[pseudo].plotID };
        socket.emit('initData', { me: db.users[pseudo], players });
    });

    socket.on('updatePlayer', (data) => {
        if(socket.userId) {
            db.users[socket.userId] = data;
            save();
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// Port dynamique pour Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Serveur Dynasty actif sur le port ${PORT}`));
