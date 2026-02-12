const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let db = { 
    users: {}, 
    globalHouses: [],
    market: [] // Liste des offres : { seller: 'Pseudo', price: 100, qty: 10 }
};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const { pseudo } = data;
        if (!db.users[pseudo]) {
            db.users[pseudo] = { 
                pseudo, gold: 50, food: 100, hp: 100, oreStock: 0 
            };
        }
        socket.userId = pseudo;
        socket.emit('authSuccess', { user: db.users[pseudo], houses: db.globalHouses, market: db.market });
    });

    socket.on('updateStats', (s) => {
        if(socket.userId) db.users[socket.userId] = s;
    });

    // Système de Shop entre joueurs
    socket.on('postOffer', (offer) => {
        db.market.push({ ...offer, id: Date.now() });
        io.emit('marketUpdate', db.market);
    });

    socket.on('buildGlobal', (h) => {
        db.globalHouses.push(h);
        socket.broadcast.emit('newHouse', h);
    });
});

http.listen(3000, () => console.log("Nexus Economy Online"));
