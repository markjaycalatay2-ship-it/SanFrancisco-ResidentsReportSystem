const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, addDoc } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwEMVMRrYLHTmFYDCNcCGkNE3ftfJLZg",
    authDomain: "barangay-sanfrancisco.firebaseapp.com",
    projectId: "barangay-sanfrancisco",
    storageBucket: "barangay-sanfrancisco.firebasestorage.app",
    messagingSenderId: "776823817699",
    appId: "1:776823817699:web:9dce8c3ab81017bb9d4cd6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, addDoc };
