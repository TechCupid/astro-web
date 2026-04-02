import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';


const firebaseConfig = {
    apiKey: "AIzaSyDUeHfam5dL6B_4RwLhO2aF_GevBPZPF_4",
    authDomain: "arunaathiastro.firebaseapp.com",
    projectId: "arunaathiastro",
    storageBucket: "arunaathiastro.firebasestorage.app",
    messagingSenderId: "223976311585",
    appId: "1:223976311585:web:2496579a3e32334546cc60",
    measurementId: "G-LPX60PVP7S"
  };

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

 



  export { app, firestore };