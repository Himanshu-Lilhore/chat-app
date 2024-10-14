import React, { useEffect, useState, useRef } from 'react';
import socket from './socket';
import Axios from 'axios';

Axios.defaults.withCredentials = true;

function App() {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [user, setUser] = useState(localStorage.getItem('userId') || '')
	const [oldUsername, setOldUsername] = useState(user)
	const [isConnected, setIsConnected] = useState(true)
	let myTimer = useRef(null);
	const [uniqueUsers, setUniqueUsers] = useState([]);

	useEffect(() => {
		let userId = localStorage.getItem('userId');

		if (!userId) {
			// Request a new userId from the server
			socket.emit('request_user_id');
			socket.on('user_id', (newUserId) => {
				userId = newUserId;
				localStorage.setItem('userId', newUserId);
			});
		} else {
			// Reconnect with the existing userId
			socket.emit('user_reconnect', userId);
		}
		setUser(userId)
		setOldUsername(userId)

		const fetchMessages = async () => {
			try {
				const response = await Axios.get(`${import.meta.env.VITE_BACKEND_URL}api/messages`);
				console.log(response.data)
				setMessages(response.data);
			} catch (error) {
				console.error('Error fetching messages:', error);
			}
		};

		fetchMessages();


		socket.on('refresh', () => {
			window.location.reload();
		});

		socket.on('message', (message) => {
			setMessages((prevMessages) => [...prevMessages, message]);
		});


		const handleConnect = () => {
			setIsConnected(true);
			console.log('Socket connected');
		};

		const handleDisconnect = () => {
			setIsConnected(false);
			console.log('Socket disconnected');
		};

		// Listen for socket connection/disconnection events
		socket.on('connect', handleConnect);
		socket.on('disconnect', handleDisconnect);

		// Cleanup event listeners on component unmount
		return () => {
			socket.off('connect', handleConnect);
			socket.off('disconnect', handleDisconnect);
		};

	}, []);


	const sendMessage = () => {
		socket.timeout(5000).emit('message', input, (err, response) => {
			if (err) {
				console.log('some issue is there');

			} else {
				console.log(response.status); // 'ok'
			}
		})
		console.log(`Sent message : ${input}`)
		setInput('');
	};


	const toggleConnect = (e) => {
		e.preventDefault();
		if (socket.connected) {
			socket.disconnect();
			console.log('disconnected')
		} else {
			socket.connect();
			console.log('connected')
		}
	};


	useEffect(() => {
		console.log(`Messsage array got updated (frontend) : \n${messages}`)
		const uniqueIds = [...new Set(messages.map(msg => msg.id))];
		setUniqueUsers(uniqueIds);
	}, [messages])

	useEffect(() => {
		console.log(`socket.connected : ${socket.connected}`)
		if (socket.connected) setIsConnected(true)
		else setIsConnected(false)
	}, [socket])


	function settingUsername(newUsername) {
		const validValue = newUsername.replace(/[^a-zA-Z0-9]/g, '');
		newUsername = validValue
		setUser(validValue);
		clearTimeout(myTimer.current);
		console.log('timer cleared')

		if (oldUsername !== '' && newUsername !== '' && oldUsername !== newUsername) {
			console.log('setting timeout')
			myTimer.current = setTimeout(() => {
				console.log('timeout ran')
				try {
					socket.emit('checkUsernameAvailability', newUsername, (err, response) => {
						if (err) {
							console.log(err);

						} else {
							if (!(response.isTaken)) {
								localStorage.setItem('userId', newUsername);
								setOldUsername(newUsername)
								console.log('New username set')
							} else {
								setUser(oldUsername)
								console.log('Username was already taken')
							}
						}
					})
				} catch (err) {
					console.log('Error checking username availability.')
				}
			}, 2000)
		}
	}



	return (
		<div className='flex flex-col gap-4 p-4 w-fit'>
			<div className='h-screen w-screen absolute top-0 left-0 bg-repeat' style={{backgroundImage: "url('./clouds.svg')"}}></div>
			<div className='text-6xl font-extrabold mb-4 w-fit bg-sky-900 z-10'>Chat App</div>
			<div className='flex flex-col gap-3 border rounded-lg p-2 backdrop-blur-sm'>
				{/* chatroom info */}
				<div className='flex flex-row gap-2 pt-1'>
					<input className='border rounded-md px-2 bg-red-500/10 text-white max-w-40 h-fit' onChange={(e) => settingUsername(e.target.value)} value={user} />
					<div className='flex flex-row gap-1 px-1 text-nowrap flex-wrap'>
						<div>Talking to : </div>
						{
							uniqueUsers.map(val => {
								if (user !== val)
									return <div className='border px-2 h-fit rounded-full' key={val}>{val}</div>
							})
						}
					</div>
				</div>

				<div className='border w-full'></div>

				{/* messages  */}
				<div className='flex flex-col gap-3'>
					{messages.map((msg, index) => (
						<div className={`flex w-full ${msg.id === oldUsername ? 'justify-end' : 'justify-start'}`} key={index}>
							<div className='flex flex-col'>
								{
									msg.id !== oldUsername ?
										<div className='text-xs px-1'>{msg.id}</div> : <></>
								}
								<div className={`${msg.id === oldUsername ? 'bg-green-500/50' : 'bg-blue-500/70'} max-w-48 rounded-md px-2 break-words`}>{msg.message}</div>
							</div>
						</div>
					))}
				</div>
				{/* Inputs  */}
				<div className='flex flex-row gap-2'>
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
						className='rounded-md px-1 text-black'
					/>
					<button onClick={sendMessage} className='px-2 border rounded-md hover:bg-zinc-600'>Send</button>
					{/* <button onClick={(e) => toggleConnect(e)} className='px-2 border rounded-md hover:bg-zinc-600'>{isConnected ? 'X' : '>'}</button> */}
				</div>
			</div>
		</div>
	);
}

export default App;
