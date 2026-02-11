import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "ID_SENDER",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const log = (msg) => document.getElementById('response').innerText = JSON.stringify(msg, null, 2);

// --- AUTH LOGIC ---
document.getElementById('googleLoginBtn').onclick = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        
        // Enviar al backend para verificar
        const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });
        const data = await res.json();
        
        if(data.success) {
            document.getElementById('googleLoginBtn').style.display = 'none';
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('userName').innerText = `Hola, ${data.user.displayName}`;
            log("Autenticado en Servidor: " + data.user.email);
        }
    } catch (error) {
        log("Error Auth: " + error.message);
    }
};

window.logout = () => {
    signOut(auth).then(() => location.reload());
};

// --- PUSH NOTIFICATION LOGIC ---
window.addPayloadField = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'payload-item';
    input.placeholder = 'Nuevo elemento';
    document.getElementById('payloadList').appendChild(input);
};

window.sendPush = async () => {
    const items = Array.from(document.querySelectorAll('.payload-item'))
                       .map(input => input.value)
                       .filter(val => val !== "");

    const payload = {
        deviceToken: document.getElementById('pushToken').value,
        title: document.getElementById('pushTitle').value,
        body: document.getElementById('pushBody').value,
        extraData: items // Esto se enviará como lista al servidor
    };

    const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    log(await res.json());
};