const admin = require('firebase-admin');

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountString) {
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', error.message);
  }
} else {
  console.warn('Warning: FIREBASE_SERVICE_ACCOUNT environment variable is not defined.');
}

/**
 * Authentication middleware that verifies Firebase ID tokens.
 * Attaches the verified decoded uid to req.userId.
 */
const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
  }
};

module.exports = verifyAuthToken;
