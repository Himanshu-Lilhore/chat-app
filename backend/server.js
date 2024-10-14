require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const port = process.env.PORT || 3000
const { v4: uuidv4 } = require('uuid');
const Message = require('./models/messageModel')
users = {}

app.use(cors({
	origin: process.env.FRONTEND_URL,
	methods: ['GET', 'POST'],
	credentials: true
}))

app.use(express.json())

let messages = []

app.get('/api/messages', async (req, res) => {
	res.json(messages)
	// try{
	// 	msgs = await Message.find()
	// 	console.log("Fetched successfully !")
	// 	res.status(200).json(msgs)
	// } catch (err) {
	// 	console.log("Error fetching messages")
	// 	res.status(400).json({ message: err.message })
	// }
})

const server = http.createServer(app)
const io = socketIo(server, {
	connectionStateRecovery: {},
	cors: {
		origin: process.env.FRONTEND_URL,
		methods: ['GET', 'POST'],
		credentials: true
	}
})


io.on('connection', (socket) => {
	console.log(`${socket.id} user connected`)

	socket.on('checkUsernameAvailability', (userID, callback) => {
		console.log(users)
		const usernamesTaken = Object.keys(users).map(key => users[key])
		let isTaken = true
		isTaken = usernamesTaken.find(username => username===userID)
		if(!isTaken) {
			messages.map(msg => {
				if(msg.id === users[socket.id]) msg.id = userID
			})
			users[socket.id] = userID
			io.emit('refresh')
			console.log(`new username set : ${userID}`)
		} else {
			console.log('username was already taken')
		}
		callback(null, {
			isTaken: isTaken
		});
	})

    socket.on('request_user_id', () => {
        const userId = uuidv4(); // Generate unique userId
        socket.emit('user_id', userId);
    });

    socket.on('user_reconnect', (userId) => {
        // Reassociate socket with the userId
        users[socket.id] = userId;
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

	socket.on('message', (message, callback) => {
		messages.push({ id: users[socket.id], message: message })
		io.emit('message', { id: users[socket.id], message: message })
		callback({
			status: 'ok'
		});
	})

	socket.on('disconnect', () => {
		console.log(`${socket.id} user DISconnected`)
	})
})

server.listen(port, () => {
	console.log(`Backend live : http://localhost:${port}/`)
})
