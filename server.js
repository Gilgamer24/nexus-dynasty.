// Dans ton fichier server.js (partie Socket.io)
io.on('connection', (socket) => {
    console.log('Un joueur est connecté : ' + socket.id);
    
    // Création du joueur avec une couleur aléatoire
    players[socket.id] = {
        x: 0, y: 0, z: 0, ry: 0,
        id: socket.id,
        color: Math.floor(Math.random() * 0xFFFFFF)
    };

    // Envoyer la liste actuelle à celui qui vient de se connecter
    socket.emit('currentPlayers', players);

    // Prévenir les autres qu'un nouveau arrive
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Relayer les mouvements à TOUT LE MONDE
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
            players[socket.id].ry = movementData.ry;
            // On renvoie l'info aux autres
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});
