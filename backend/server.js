const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}))

app.use(express.json())

const messages = []

app.get('/api/messages', (req, res) => {
  res.json(messages)
})

const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

io.on('connection', (socket) => {
  console.log(`${socket.id} user connected`)

  socket.on('message', (message) => {
    messages.push({id: socket.id, message: message})
    io.emit('message', {id: socket.id, message: message})
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} user DISconnected`)
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
