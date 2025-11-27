// IMPORTAMOS FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// NOTA: Agregamos onSnapshot y serverTimestamp aquí
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// GUARDAR PUNTOS
window.guardarPuntaje = async (juego, puntos) => {
    const user = auth.currentUser;
    if (user) {
        const alias = localStorage.getItem('customAlias') || user.displayName;
        const docId = `${user.uid}_${juego.replace(/\s/g, '')}`; 
        const docRef = doc(db, "puntuaciones", docId);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (puntos <= data.puntos) return; 
            }
            await setDoc(docRef, {
                nombre: alias,
                foto: user.photoURL,
                juego: juego,
                puntos: puntos,
                fecha: new Date(),
                uid: user.uid
            });
        } catch (e) { console.error(e); }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. USUARIO Y ALIAS ---
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const editNameBtn = document.getElementById('editNameBtn');
    
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
        logoutBtn.addEventListener('click', () => { signOut(auth).then(() => { localStorage.removeItem('bloxUsername'); location.reload(); }); });

        if(editNameBtn) editNameBtn.addEventListener('click', () => { aliasModal.style.display = 'flex'; newAliasInput.value = userName.innerText; });
        if(saveAliasBtn) saveAliasBtn.addEventListener('click', () => {
            const newName = newAliasInput.value.trim();
            if(newName.length > 0 && newName.length <= 12) {
                localStorage.setItem('customAlias', newName); userName.innerText = newName; aliasModal.style.display = 'none';
            } else alert("Nombre inválido.");
        });
        if(cancelAliasBtn) cancelAliasBtn.addEventListener('click', () => aliasModal.style.display = 'none');

        onAuthStateChanged(auth, (user) => {
            if (user) {
                loginBtn.style.display = 'none'; userInfo.style.display = 'flex';
                userPhoto.src = user.photoURL; updateDisplayName(user.displayName);
                localStorage.setItem('bloxUsername', user.displayName);
            } else {
                loginBtn.style.display = 'inline-block'; userInfo.style.display = 'none';
            }
        });
    }

    // --- 2. RANKING ---
    const tablaRanking = document.getElementById('tabla-ranking-body');
    const rankTabs = document.querySelectorAll('.rank-tab');

    if (tablaRanking) {
        const defaultGame = document.querySelector('.rank-tab.active').getAttribute('data-game');
        cargarRanking(defaultGame);
        rankTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                rankTabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
                cargarRanking(tab.getAttribute('data-game'));
            });
        });
    }

    async function cargarRanking(juegoSeleccionado) {
        tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">Cargando Top de ${juegoSeleccionado}... ⏳</td></tr>`;
        try {
            const q = query(collection(db, "puntuaciones"), where("juego", "==", juegoSeleccionado), orderBy("puntos", "desc"), limit(10));
            const querySnapshot = await getDocs(q);
            tablaRanking.innerHTML = ""; 
            let posicion = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                let rankIcon = `#${posicion}`;
                if(posicion === 1) rankIcon = "🥇"; if(posicion === 2) rankIcon = "🥈"; if(posicion === 3) rankIcon = "🥉";
                const fila = `<tr><td class="player-rank" style="font-size:1.2em;">${rankIcon}</td><td style="display:flex; align-items:center; gap:10px;"><img src="${data.foto}" style="width:24px; height:24px; border-radius:50%; border:1px solid #555;">${data.nombre}</td><td style="color:#aaa;">${data.juego}</td><td class="player-score" style="color:${posicion===1 ? '#00fff2' : '#fff'}">${data.puntos}</td></tr>`;
                tablaRanking.innerHTML += fila;
                posicion++;
            });
            if(querySnapshot.empty) tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Nadie ha jugado a ${juegoSeleccionado} aún.</td></tr>`;
        } catch (error) { console.error(error); tablaRanking.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff4757;">⚠️ Error al cargar.</td></tr>`; }
    }

    // --- 3. UI Y FILTROS ---
    const searchInput = document.getElementById('searchInput');
    const buttons = document.querySelectorAll('.category-buttons .btn');
    const subButtons = document.querySelectorAll('.sub-filter');
    const cards = document.querySelectorAll('.game-card');
    let currentCategory = 'all'; let currentTag = 'all'; let searchTerm = '';

    function filterGames() {
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category'); const cardTag = card.getAttribute('data-tag');
            const title = card.querySelector('h3').innerText.toLowerCase();
            const matchCat = (currentCategory === 'all' || cardCat === currentCategory);
            let matchTag = true; if (currentTag !== 'all') matchTag = (cardTag === currentTag);
            const matchSearch = title.includes(searchTerm);
            if (matchCat && matchTag && matchSearch) { card.style.display = 'flex'; setTimeout(() => card.style.opacity = '1', 50); }
            else { card.style.display = 'none'; card.style.opacity = '0'; }
        });
    }

    if(searchInput) searchInput.addEventListener('input', (e) => { searchTerm = e.target.value.toLowerCase(); filterGames(); });
    buttons.forEach(btn => { btn.addEventListener('click', function() { buttons.forEach(b => b.classList.remove('active')); this.classList.add('active'); currentCategory = this.getAttribute('data-filter'); subButtons.forEach(b => b.classList.remove('active')); document.querySelector('.sub-filter[data-tag="all"]').classList.add('active'); currentTag = 'all'; filterGames(); }); });
    subButtons.forEach(btn => { btn.addEventListener('click', function(e) { e.preventDefault(); subButtons.forEach(b => b.classList.remove('active')); this.classList.add('active'); currentTag = this.getAttribute('data-tag'); filterGames(); }); });

    // Scroll Reveal
    const revealElements = document.querySelectorAll('.reveal');
    function checkReveal() { const windowHeight = window.innerHeight; revealElements.forEach((reveal) => { const elementTop = reveal.getBoundingClientRect().top; if (elementTop < windowHeight - 50) { reveal.classList.add('active'); reveal.style.opacity = "1"; } }); }
    window.addEventListener('scroll', checkReveal); checkReveal(); setTimeout(() => { document.querySelectorAll('.reveal').forEach(el => el.style.opacity = '1'); }, 500);

    // Sonidos UI
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let uiAudioCtx;
    const playHoverSound = () => {
        if (!uiAudioCtx) uiAudioCtx = new AudioContext(); if (uiAudioCtx.state === 'suspended') uiAudioCtx.resume();
        const osc = uiAudioCtx.createOscillator(); const gain = uiAudioCtx.createGain();
        osc.connect(gain); gain.connect(uiAudioCtx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, uiAudioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, uiAudioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.02, uiAudioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, uiAudioCtx.currentTime + 0.05);
        osc.start(); osc.stop(uiAudioCtx.currentTime + 0.05);
    };
    document.querySelectorAll('.game-card, .btn, .nav-links a, .sub-filter, .rank-tab').forEach(el => el.addEventListener('mouseenter', playHoverSound));

    // --- 6. CHAT GLOBAL (NUEVO) ---
    const chatToggle = document.getElementById('chatToggleBtn');
    const chatContainer = document.getElementById('chatContainer');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesBox = document.getElementById('chatMessages');

    if(chatToggle) {
        // Abrir/Cerrar
        chatToggle.addEventListener('click', () => chatContainer.classList.add('open'));
        closeChatBtn.addEventListener('click', () => chatContainer.classList.remove('open'));

        // Enviar Mensaje
        const sendMessage = async () => {
            const text = chatInput.value.trim();
            const user = auth.currentUser;
            
            if(!user) { alert("Debes iniciar sesión para chatear."); return; }
            if(text === "") return;

            const alias = localStorage.getItem('customAlias') || user.displayName.split(' ')[0];

            try {
                await addDoc(collection(db, "chat"), {
                    usuario: alias,
                    mensaje: text,
                    timestamp: serverTimestamp() // Hora del servidor
                });
                chatInput.value = "";
            } catch(e) { console.error("Error chat:", e); }
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

        // ESCUCHAR MENSAJES (EN VIVO)
        const qChat = query(collection(db, "chat"), orderBy("timestamp", "desc"), limit(20));
        onSnapshot(qChat, (snapshot) => {
            messagesBox.innerHTML = ''; // Limpiar para reordenar
            // Snapshot viene en orden descendente (nuevos primero), invertimos para chat
            const msgs = [];
            snapshot.forEach(doc => msgs.push(doc.data()));
            msgs.reverse(); // Viejos arriba, nuevos abajo

            msgs.forEach(data => {
                if(!data.timestamp) return; // Ignorar mensajes en proceso de escritura
                const isMine = auth.currentUser && (localStorage.getItem('customAlias') === data.usuario || auth.currentUser.displayName.includes(data.usuario));
                
                const div = document.createElement('div');
                div.className = `message ${isMine ? 'mine' : ''}`;
                div.innerHTML = `<span class="msg-user">${data.usuario}:</span> <span class="msg-content">${data.mensaje}</span>`;
                messagesBox.appendChild(div);
            });
            // Auto scroll al fondo
            messagesBox.scrollTop = messagesBox.scrollHeight;
        });
    }
});
