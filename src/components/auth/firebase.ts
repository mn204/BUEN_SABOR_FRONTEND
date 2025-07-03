// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAco_C-eQbSyRF_ug0VnzPPCD_Dk3QR3Zg",
    authDomain: "buen-sabor-e52e3.firebaseapp.com",
    projectId: "buen-sabor-e52e3",
    storageBucket: "buen-sabor-e52e3.appspot.com",
    messagingSenderId: "746939563134",
    appId: "1:746939563134:web:13e16bbe254b3cff32ec2f",
    measurementId: "G-WYLMFSEVMF",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
