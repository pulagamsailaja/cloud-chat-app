// Firebase v9+ modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { 
  getDatabase, ref, push, onValue, set,get
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging.js";

// Firebase config
const firebaseConfig = {
  /* At $ sign, use your own details of the cloud*/
  apiKey: "$",
  authDomain: "$",
  databaseURL: "$",
  projectId: "$",
  storageBucket: "$",
  messagingSenderId: "$",
  appId: "$"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Initialize Messaging
const messaging = getMessaging(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Export everything needed in script.js
export { 
  auth, googleProvider, githubProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile,
  db, ref, push, set, onValue,
  messaging, getToken, onMessage
};

// Realtime Database automatically supports offline persistence
// Optional: detect online/offline status
// console.log("Connected to Firebase");
// console.log("Offline");
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log("Connected to Firebase");
  } else {
    console.log("Offline");
  }
});

// =================== CLOUD MESSAGING ===================
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BP2lLhDZkHUniD2963gOlJAL4KZzN9_Tw4oRRzbNFVh3E2H9Mg63R0DcVfgyu4tTLrugV-E8sHoKxlXF8LV07zk"
      });
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("Notification permission denied.");
    }
  } catch (err) {
    console.error("Notification setup error:", err);
  }
}
