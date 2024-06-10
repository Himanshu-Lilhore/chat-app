import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Adjust the URL as per your backend server address

export default socket;
