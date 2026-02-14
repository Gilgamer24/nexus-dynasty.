const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

// Configuration des fichiers statiques
app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');

// Structure initiale de la base de données
let db = { 
    users: {}, 
    globalHouses: [] 
};

// Chargement de la base de données au démarrage
if (fs.existsSync(DB_PATH)) {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        if (data) {
            db = JSON.parse(data);
            console.log("✅ Base de données database.json chargée avec succès.");
        }
    } catch (err) {
        console.error("⚠️ Erreur de lecture du JSON, initialisation d'une nouvelle base.");
    }
}

// Fonction de sauvegarde sécurisée
function saveDB() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log("💾 Modification enregistrée dans database.json");
    } catch (err) {
        console.error("❌ Erreur lors de l'écriture du fichier :", err);
    }
}

let players = {};

io.on('connection', (socket) => {
    console.log(`🔌 Nouvelle connexion : ${socket.id}`);

    socket.on('login', (data) => {
        const pseudo = data.pseudo || "Anonyme";
        
        // Si l'utilisateur n'existe pas, on lui crée un compte et on lui donne un terrain (Plot)
        if (!db.users[pseudo]) {
            // Attribution d'un terrain entre 1 et 8 basé sur le nombre de joueurs inscrits
            const plotID = (Object.keys(db.users).length % 8) + 1;
            
            db.users[pseudo] = { 
                pseudo: pseudo, 
                gold: 500, 
                food: 100, 
                oreStock: 0, 
                plotID: plotID 
            };
            saveDB();
        }

        socket.userId = pseudo;
        
        // On enregistre sa position temporaire pour le multi
        players[socket.id] = { 
            id: socket.id, 
            pseudo: pseudo, 
            x: 0, 
            z: 0, 
            plotID: db.users[pseudo].plotID 
        };

        // Envoi des données initiales au joueur (ses stats + les maisons existantes + les autres joueurs)
        socket.emit('initData', { 
            me: db.users[pseudo], 
            houses: db.globalHouses, 
            players: players 
        });

        // Informe les autres qu'un joueur est arrivé
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    // Mise à jour de la position pour le multijoueur
    socket.on('move', (pos) => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].z = pos.z;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Enregistrement d'une nouvelle maison (Construction)
    socket.on('newHouse', (houseData) => {
        // On ajoute le pseudo du propriétaire à la maison
        const newHouse = { ...houseData, owner: socket.userId };
        db.globalHouses.push(newHouse);
        
        // On diffuse la nouvelle maison à tout le monde
        io.emit('houseBuilt', newHouse);
        saveDB();
    });

    // Mise à jour des stats (Gold, Food, Ore)
    socket.on('updatePlayer', (updatedStats) => {
        if (socket.userId && db.users[socket.userId]) {
            db.users[socket.userId] = updatedStats;
            saveDB();
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Déconnexion : ${socket.id}`);
        io.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`
    ===========================================
    🚀 SERVEUR NEXUS DYNASTY ACTIF
    📍 URL : http://localhost:${PORT}
    💾 Base de données : database.json
    ===========================================
    `);
});
