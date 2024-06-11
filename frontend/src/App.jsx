// src/App.js
import React, { useEffect, useState } from 'react';
import socket from './socket';
import Axios from 'axios';

Axios.defaults.withCredentials = true;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    
    const fetchMessages = async () => {
      try {
        const response = await Axios.get('http://localhost:3000/api/messages');
        console.log(response.data)
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  
  const sendMessage = () => {
    socket.emit('message', input);
    console.log(`Sent message : ${input}`)
    setInput('');
  };


  useEffect(() => {
    console.log(`Messsage array got updated (frontend) : \n${messages}`)
  }, [messages])


  return (
    <div>
      <h1>Chat App</h1>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg.id} : {msg.message}</div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
