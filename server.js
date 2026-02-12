const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static(__dirname));

// --- GESTION DE LA BASE DE DONNÉES ---
let db = { users: {} };
const DB_PATH = './database.json';

if (fs.existsSync(DB_PATH)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_PATH));
        console.log("Données chargées avec succès.");
    } catch (e) {
        console.error("Erreur de lecture DB, reset en cours.");
    }
}

function saveDB() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const pseudo = data.pseudo;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, gold: 200, food: 100, hp: 100, oreStock: 0, houses: [] 
            };
            saveDB();
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', { me: db.users[pseudo] });
    });

    socket.on('saveAll', (data) => {
        if(socket.userId) {
            db.users[socket.userId] = data;
            saveDB();
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`Serveur prêt sur http://localhost:${PORT}`));
