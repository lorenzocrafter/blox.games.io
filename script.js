// IMPORTAMOS FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- FUNCIÓN INTELIGENTE: SOLO GUARDA SI ES RÉCORD ---
window.guardarPuntaje = async (juego, puntos) => {
    const user = auth.currentUser;
    if (user) {
        const alias = localStorage.getItem('customAlias') || user.displayName;
        
        // Creamos un ID único: "IDUsuario_NombreJuego"
        // Así evitamos duplicados. Solo puede haber UNA entrada por juego para este usuario.
        const docId = `${user.uid}_${juego.replace(/\s/g, '')}`; 
        const docRef = doc(db, "puntuaciones", docId);

        try {
            // 1. Revisamos si ya tiene un récord
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Si el puntaje nuevo es MENOR o IGUAL al viejo, NO hacemos nada.
                if (puntos <= data.puntos) {
                    console.log(`No es récord. Actual: ${data.puntos} vs Nuevo: ${puntos}`);
                    return; 
                }
            }

            // 2. Si llegamos aquí, es un Nuevo Récord -> Guardamos/Sobrescribimos
            await setDoc(docRef, {
                nombre: alias,
                foto: user.photoURL,
                juego: juego,
                puntos: puntos,
                fecha: new Date(),
                uid: user.uid // Guardamos ID para referencias futuras
            });
            console.log(`¡NUEVO RÉCORD GUARDADO! ${juego}: ${puntos}`);

        } catch (e) {
            console.error("Error al guardar:", e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. GESTIÓN DE USUARIO ---
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const editNameBtn = document.getElementById('editNameBtn');
    
    // Modal Elementos
    const aliasModal = document.getElementById('aliasModal');
    const newAliasInput = document.getElementById('newAliasInput');
    const saveAliasBtn = document.getElementById('saveAliasBtn');
    const cancelAliasBtn = document.getElementById('cancelAliasBtn');

    function updateDisplayName(googleName) {
        const storedAlias = localStorage.getItem('customAlias');
        userName.innerText = storedAlias || googleName.split(' ')[0];
    }

    if(loginBtn) {
        loginBtn.addEventListener('click', () => signInWithPopup(auth, provider).catch(e => alert(e.message)));
        
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => { localStorage.removeItem('bloxUsername'); location.reload(); });
        });

        if(editNameBtn) {
            editNameBtn.addEventListener('click', () => {
                aliasModal.style.display = 'flex';
                newAliasInput.value = userName.innerText;
            });
        }

        saveAliasBtn.addEventListener('click', () => {
            const newName = newAliasInput.value.trim();
            if(newName.length > 0 && newName.length <= 12) {
                localStorage.setItem('customAlias', newName);
                userName.innerText = newName;
                aliasModal.style.display = 'none';
            } else alert("Nombre inválido.");
        });

        cancelAliasBtn.addEventListener('click', () => aliasModal.style.display = 'none');

        onAuthStateChanged(auth, (user) => {
            if (user) {
                loginBtn.style.display = 'none';
                userInfo.style.display = 'flex';
                userPhoto.src = user.photoURL;
                updateDisplayName(user.displayName);
                localStorage.setItem('bloxUsername', user.displayName);
            } else {
                loginBtn.style.display = 'inline-block';
                userInfo.style.display = 'none';
            }
        });
    }

    // --- 2. RANKING POR PESTAÑAS ---
    const tablaRanking = document.getElementById('tabla-ranking-body');
    const rankTabs = document.querySelectorAll('.rank-tab');

    if (tablaRanking) {
        // Cargar el primer juego por defecto (El que tenga la clase active)
        const defaultGame = document.querySelector('.rank-tab.active').getAttribute('data-game');
        cargarRanking(defaultGame);

        // Eventos de Click en las pestañas
        rankTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Cambiar estilo visual
                rankTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Cargar datos del juego seleccionado
                const gameName = tab.getAttribute('data-game');
                cargarRanking(gameName);
            });
        });
    }

    async function cargarRanking(juegoSeleccionado) {
        tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">Cargando Top de ${juegoSeleccionado}... ⏳</td></tr>`;
        
        try {
            // Consulta Filtrada: Solo este juego, ordenado por puntos
            const q = query(
                collection(db, "puntuaciones"), 
                where("juego", "==", juegoSeleccionado),
                orderBy("puntos", "desc"), 
                limit(10)
            );
            
            const querySnapshot = await getDocs(q);
            
            tablaRanking.innerHTML = ""; 
            let posicion = 1;
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Medalla para los top 3
                let rankIcon = `#${posicion}`;
                if(posicion === 1) rankIcon = "🥇";
                if(posicion === 2) rankIcon = "🥈";
                if(posicion === 3) rankIcon = "🥉";

                const fila = `
                    <tr>
                        <td class="player-rank" style="font-size:1.2em;">${rankIcon}</td>
                        <td style="display:flex; align-items:center; gap:10px;">
                            <img src="${data.foto}" style="width:24px; height:24px; border-radius:50%; border:1px solid #555;">
                            ${data.nombre}
                        </td>
                        <td style="color:#aaa;">${data.juego}</td>
                        <td class="player-score" style="color:${posicion===1 ? '#00fff2' : '#fff'}">${data.puntos}</td>
                    </tr>
                `;
                tablaRanking.innerHTML += fila;
                posicion++;
            });

            if(querySnapshot.empty) {
                tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Nadie ha jugado a ${juegoSeleccionado} aún. <br>¡Sé el primero!</td></tr>`;
            }

        } catch (error) {
            console.error("Error ranking:", error);
            // Si falta el índice, esto ayuda a detectarlo
            if(error.message.includes("requires an index")) {
                console.log("¡ALERTA! Necesitas crear un índice en Firebase. Revisa la consola.");
            }
            tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff4757;">⚠️ Error de Base de Datos. Revisa la consola.</td></tr>`;
        }
    }

    // --- 3. LÓGICA DE JUEGOS Y UI ---
    // (Filtros, Buscador y Scroll - Igual que antes)
    const searchInput = document.getElementById('searchInput');
    const buttons = document.querySelectorAll('.category-buttons .btn');
    const subButtons = document.querySelectorAll('.sub-filter');
    const cards = document.querySelectorAll('.game-card');
    let currentCategory = 'all'; let currentTag = 'all'; let searchTerm = '';

    function filterGames() {
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            const cardTag = card.getAttribute('data-tag');
            const title = card.querySelector('h3').innerText.toLowerCase();
            const matchCat = (currentCategory === 'all' || cardCat === currentCategory);
            let matchTag = true; if (currentTag !== 'all') matchTag = (cardTag === currentTag);
            const matchSearch = title.includes(searchTerm);

            if (matchCat && matchTag && matchSearch) {
                card.style.display = 'flex'; setTimeout(() => card.style.opacity = '1', 50);
            } else {
                card.style.display = 'none'; card.style.opacity = '0';
            }
        });
    }

    if(searchInput) searchInput.addEventListener('input', (e) => { searchTerm = e.target.value.toLowerCase(); filterGames(); });
    buttons.forEach(btn => { btn.addEventListener('click', function() { buttons.forEach(b => b.classList.remove('active')); this.classList.add('active'); currentCategory = this.getAttribute('data-filter'); subButtons.forEach(b => b.classList.remove('active')); document.querySelector('.sub-filter[data-tag="all"]').classList.add('active'); currentTag = 'all'; filterGames(); }); });
    subButtons.forEach(btn => { btn.addEventListener('click', function(e) { e.preventDefault(); subButtons.forEach(b => b.classList.remove('active')); this.classList.add('active'); currentTag = this.getAttribute('data-tag'); filterGames(); }); });

    const revealElements = document.querySelectorAll('.reveal');
    function checkReveal() { const windowHeight = window.innerHeight; revealElements.forEach((reveal) => { const elementTop = reveal.getBoundingClientRect().top; if (elementTop < windowHeight - 50) { reveal.classList.add('active'); reveal.style.opacity = "1"; } }); }
    window.addEventListener('scroll', checkReveal); checkReveal(); setTimeout(() => { document.querySelectorAll('.reveal').forEach(el => el.style.opacity = '1'); }, 500);
});
