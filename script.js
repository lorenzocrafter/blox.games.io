// IMPORTAMOS FIREBASE (Auth + Base de Datos)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TU CONFIGURACIÓN
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
const db = getFirestore(app); // Base de datos
const provider = new GoogleAuthProvider();

// --- FUNCIÓN GLOBAL PARA GUARDAR PUNTOS (Los juegos la llamarán) ---
window.guardarPuntaje = async (juego, puntos) => {
    const user = auth.currentUser;
    if (user) {
        try {
            await addDoc(collection(db, "puntuaciones"), {
                nombre: user.displayName,
                foto: user.photoURL,
                juego: juego,
                puntos: puntos,
                fecha: new Date()
            });
            console.log("Puntaje guardado en la nube!");
        } catch (e) {
            console.error("Error al guardar: ", e);
        }
    } else {
        console.log("Jugador no identificado, puntaje solo local.");
    }
};

// --- LÓGICA DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SISTEMA DE LOGIN
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');

    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            signInWithPopup(auth, provider).then((result) => {
                console.log("Conectado");
            }).catch((error) => alert("Error: " + error.message));
        });

        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                localStorage.removeItem('bloxUsername');
                window.location.reload();
            });
        });

        onAuthStateChanged(auth, (user) => {
            if (user) {
                loginBtn.style.display = 'none';
                userInfo.style.display = 'flex';
                userPhoto.src = user.photoURL;
                userName.innerText = user.displayName.split(' ')[0];
                localStorage.setItem('bloxUsername', user.displayName);
            } else {
                loginBtn.style.display = 'inline-block';
                userInfo.style.display = 'none';
            }
        });
    }

    // 2. SISTEMA DE RANKING (Solo si estamos en la página ranking.html)
    const tablaRanking = document.getElementById('tabla-ranking-body');
    if (tablaRanking) {
        cargarRankingGlobal();
    }

    async function cargarRankingGlobal() {
        // Pedimos los 10 mejores puntajes de TODOS los tiempos
        const q = query(collection(db, "puntuaciones"), orderBy("puntos", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        tablaRanking.innerHTML = ""; // Limpiar tabla (adiós bots)

        let posicion = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const fila = `
                <tr>
                    <td class="player-rank">#${posicion}</td>
                    <td style="display:flex; align-items:center; gap:10px;">
                        <img src="${data.foto}" style="width:24px; height:24px; border-radius:50%;">
                        ${data.nombre}
                    </td>
                    <td>${data.juego}</td>
                    <td class="player-score">${data.puntos}</td>
                </tr>
            `;
            tablaRanking.innerHTML += fila;
            posicion++;
        });

        if(querySnapshot.empty) {
            tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Todavía nadie ha hecho historia. ¡Sé el primero!</td></tr>`;
        }
    }

    // 3. UI y Filtros
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
});
