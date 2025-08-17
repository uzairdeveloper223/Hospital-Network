// Firebase configuration and initialization
import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDqa8y_v6YNJ0_6IpkNdjuLHdfffnSj_0U",
  authDomain: "hospital-management-mirpur.firebaseapp.com",
  databaseURL: "https://hospital-management-mirpur-default-rtdb.firebaseio.com",
  projectId: "hospital-management-mirpur",
  storageBucket: "hospital-management-mirpur.firebasestorage.app",
  messagingSenderId: "677665778721",
  appId: "1:677665778721:web:2d6cb3a5cb8ad14b0a8760"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

export default app
