const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

// Dossier statique
app.use(express.static(__dirname));

// Fichier de sauvegarde
const DB_PATH = path.join(__dirname, 'database.json');
let db = { users: {}, globalHouses: [] };

// Chargement de la sauvegarde si elle existe
if (fs.existsSync(DB_PATH)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        console.log("✅ Base de données chargée.");
    } catch (e) {
        console.log("⚠️ Création d'une nouvelle base de données.");
    }
}

// Fonction de sauvegarde
function save() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let players = {};

io.on('connection', (socket) => {
    console.log(`Connexion : ${socket.id}`);

    socket.on('login', (data) => {
        const pseudo = data.pseudo || "Joueur";
        
        // Création du compte si nouveau
        if (!db.users[pseudo]) {
            // Assigne un terrain de 1 à 8
            const plotID = (Object.keys(db.users).length % 8) + 1;
            
            db.users[pseudo] = { 
                pseudo: pseudo, 
                gold: 500,        // Argent de départ
                wood: 0,          // Bois
                oreStock: 0,      // Minerai dans l'inventaire
                plotID: plotID,   // Numéro du terrain
                privateHouses: [], // Maisons dans la zone privée
                workersCount: 0   // Nombre de robots achetés
            };
            save();
            console.log(`✨ Nouveau seigneur : ${pseudo} (Plot #${plotID})`);
        }

        socket.userId = pseudo;
        
        // Initialisation du joueur en ligne
        players[socket.id] = { 
            id: socket.id, 
            pseudo: pseudo, 
            x: 0, 
            z: 0, 
            plotID: db.users[pseudo].plotID 
        };

        // Envoi des infos au client
        socket.emit('initData', { 
            me: db.users[pseudo], 
            players: players 
        });

        // Prévenir les autres (pour le futur multi)
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    // Sauvegarde des stats (Or, Bois, etc.) reçues du client
    socket.on('updatePlayer', (data) => {
        if(socket.userId) {
            db.users[socket.userId] = data;
            save();
        }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log(`Déconnexion : ${socket.id}`);
        delete players[socket.id];
    });
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`
    =========================================
    🚀 SERVEUR NEXUS DYNASTY EN LIGNE
    📍 Adresse : http://localhost:${PORT}
    =========================================
    `);
});
