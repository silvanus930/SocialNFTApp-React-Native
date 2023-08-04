const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (process.env.NODE_ENV === "test") {
  const firebaseConfig = {
    apiKey: "AIzaSyA7Tl3uM_OpF6a_ozaBW9XkBzWqC9V8dZc",
    authDomain: "persona-test-8c340.firebaseapp.com",
    projectId: "persona-test-8c340",
    storageBucket: "persona-test-8c340.appspot.com",
    messagingSenderId: "162967164670",
    appId: "1:162967164670:web:0c74c8ab8556f7821df7af",
  };
  admin.initializeApp(firebaseConfig);
} else {
  admin.initializeApp();
}
const db = admin.firestore();
const rtdb = admin.database();

module.exports = {
  db,
  rtdb,
  admin,
  functions,
};
