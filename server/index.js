const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://192.168.1.14:4200",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
let connectedUsers = 0;
let users = {}; // Objeto para armazenar os nomes dos usuários

app.use(cors());
app.use(express.static('client'));

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  connectedUsers++;

  // Evento para solicitar o nome do usuário
  socket.emit('request name');

  // Quando o cliente envia seu nome
  socket.on('name', (name) => {
    console.log('Nome recebido:', name);
    users[socket.id] = name; // Armazena o nome associado ao ID do socket
    io.emit('userCount', { count: connectedUsers, users: Object.values(users) }); // Envia a contagem e os nomes para todos os clientes
    socket.broadcast.emit('message', { type: 'join', text: `${name} entrou no chat`, sender: name });
  });

  // Quando o cliente se desconecta
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    connectedUsers--;
    const name = users[socket.id];
    delete users[socket.id];
    io.emit('userCount', { count: connectedUsers, users: Object.values(users) }); // Atualiza a contagem e os nomes para todos os clientes
    socket.broadcast.emit('message', { type: 'leave', text: `${name} desconectou`, sender: name });
  });

  // Quando o cliente envia uma mensagem
  socket.on('send message', ({ text, sender }) => {
    console.log('Mensagem recebida:', { text, sender });
    io.emit('message', { type: 'text', text, sender });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor está ouvindo na porta ${PORT}`);
});