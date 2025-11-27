// IMPORTAMOS FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBduWRoZK8ia-UP3W-tJWtVu3_lTHKRp9M",
  authDomain: "blox-games-78e8b.firebaseapp.com",
  projectId: "blox-games-78e8b",
  storageBucket: "blox-games-78e8b.firebasestorage.app",
  messagingSenderId: "882404453394",
  appId: "1:882404453394:web:c79ee2a8cb29a6cd837ccb",
  measurementId: "G-BFKX5P23SN"
};

// INICIALIZAR
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SISTEMA DE LOGIN GOOGLE ---
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');

    if(loginBtn) {
        // LOGIN
        loginBtn.addEventListener('click', () => {
            signInWithPopup(auth, provider)
                .then((result) => {
                    console.log("Conectado:", result.user.displayName);
                }).catch((error) => {
                    console.error("Error:", error);
                    alert("Error al conectar con Google.");
                });
        });

        // LOGOUT
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log("Desconectado");
                localStorage.removeItem('bloxUsername');
            });
        });

        // MONITOR DE ESTADO (Se ejecuta solo cuando entras o sales)
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Si hay usuario: Esconder botón login, mostrar foto
                loginBtn.style.display = 'none';
                userInfo.style.display = 'flex';
                userPhoto.src = user.photoURL;
                userName.innerText = user.displayName.split(' ')[0]; // Solo el nombre
                
                // Guardar nombre para los juegos
                localStorage.setItem('bloxUsername', user.displayName);
            } else {
                // Si no hay usuario: Mostrar botón login
                loginBtn.style.display = 'inline-block';
                userInfo.style.display = 'none';
            }
        });
    }

    // --- 2. FILTROS DE JUEGOS ---
    const buttons = document.querySelectorAll('.category-buttons .btn');
    const cards = document.querySelectorAll('.game-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filterValue = this.getAttribute('data-filter');

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = 'flex'; 
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }
            });
        });
    });

    // --- 3. SMOOTH SCROLL ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});
