import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: "AIzaSyAMJKOEh5G9nsKP1z6YD3q-VWsi4zs3xEM",
  authDomain: "mdtijepara.firebaseapp.com",
  projectId: "mdtijepara",
  storageBucket: "mdtijepara.firebasestorage.app",
  messagingSenderId: "69396522171",
  appId: "1:69396522171:web:c41eedc51e243fe5a3759e",
  measurementId: "G-3H70PVN7GB"
};

// Initialize Firebase App instance safely (singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore instance correctly based on project configuration
const databaseId =
  firebaseConfig.projectId === firebaseConfigJson.projectId
    ? firebaseConfigJson.firestoreDatabaseId || '(default)'
    : '(default)';

export const db: Firestore =
  databaseId && databaseId !== '(default)'
    ? getFirestore(app, databaseId)
    : getFirestore(app);

export default db;
