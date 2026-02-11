import express from 'express';
import admin from 'firebase-admin';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { readFile } from 'fs/promises';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
  await readFile(new URL('./serviceAccountKey.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/docs'));

// --- ENDPOINTS ---

// Verificar Token de Google/Proveedor
app.post('/api/auth/verify', async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ error: "No autorizado", details: error.message });
  }
});

// Enviar Notificación con Payload Flexible
app.post('/api/notify', async (req, res) => {
  const { deviceToken, title, body, extraData } = req.body; 
  // extraData será un array que convertiremos a string

  const message = {
    notification: { title, body },
    data: {
      items: JSON.stringify(extraData || []) // Convertimos la lista a string para FCM
    },
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server en http://localhost:${PORT}`));