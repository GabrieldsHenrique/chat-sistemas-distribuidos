const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://200.235.90.15:4200",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
let connectedUsers = 0;
let users = {}; 

const palavras = [
  'Elefante', 'Girafa', 'Leão', 'Tigre', 'Zebra', 'Rinoceronte', 'Hipopótamo', 'Crocodilo', 'Gorila', 'Macaco',
  'Chimpanzé', 'Panda', 'Canguru', 'Coalho', 'Esquilo', 'Raposa', 'Lobo', 'Urso', 'Lontra', 'Castor',
  'Foca', 'Baleia', 'Golfinho', 'Tubarão', 'Polvo', 'Lula', 'Caranguejo', 'Lagosta', 'Tartaruga', 'Cobra',
  'Jacaré', 'Camaleão', 'Aranha', 'Escorpião', 'Abelha', 'Vespa', 'Formiga', 'Besouro', 'Borboleta', 'Libélula',
  'Louva-a-deus', 'Gafanhoto', 'Grilo', 'Sapo', 'Rã', 'Salamandra', 'Axolote', 'Jabuti', 'Cágado', 'Pato',
  'Ganso', 'Cisne', 'Pomba', 'Águia', 'Falcão', 'Coruja', 'Gaivota'
];

let palavraAtual = '';

function escolherPalavraAleatoria() {
  const indice = Math.floor(Math.random() * palavras.length);
  palavraAtual = palavras[indice];

  io.emit('message', { type: 'text',text: `Temos uma nova palavra`,  sender: 'Admin'})
  io.emit('palavraAtual', palavraAtual);
}

escolherPalavraAleatoria();

app.use(cors());
app.use(express.static('client'));

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  connectedUsers++;

  socket.emit('request name');

 
  socket.on('name', (name) => {
    console.log('Nome recebido:', name);
    users[socket.id] = name; 
    io.emit('userCount', { count: connectedUsers, users: Object.values(users) });
    socket.broadcast.emit('message', { type: 'join', text: `${name} entrou no chat`, sender: name });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    connectedUsers--;
    const name = users[socket.id];
    delete users[socket.id];
    io.emit('userCount', { count: connectedUsers, users: Object.values(users) });
    socket.broadcast.emit('message', { type: 'leave', text: `${name} desconectou`, sender: name });
  });

  socket.on('send message', ({ text, sender }) => {

    io.emit('message', { type: 'text', text, sender });
    if (text.toLowerCase() === palavraAtual.toLowerCase()) {

      io.emit('message', { type: 'text',text: `O usuário ${sender} acertou a palavra "${palavraAtual}"`,  sender: 'Admin'})
      escolherPalavraAleatoria();
    }

  });

  socket.emit('palavraAtual', palavraAtual);
});



server.listen(PORT, () => {
  console.log(`Servidor está ouvindo na porta ${PORT}`);
});