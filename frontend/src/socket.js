import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL); // Adjust the URL as per your backend server address

export default socket;
