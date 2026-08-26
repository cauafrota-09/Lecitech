import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD507yI1k5nIKAHit-xNEglMfbvyU-mwjo",
  databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com/",
  projectId: "lecitech-78671"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const ventoRef = ref(database, 'estacao/vento');
const displayVal = document.getElementById('valor-atual-destaque');

onValue(ventoRef, (snapshot) => {
  const val = snapshot.val();
  if (displayVal) displayVal.innerText = val !== null ? val : '--';
});