// Firebase Configuration
// Expects window.ENV to be populated by env-config.js
const env = window.ENV || {};

const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: "https://krmu-impact-bf09e-default-rtdb.firebaseio.com", // Keeping hardcoded as it's not sensitive/variable usually
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    // Prevent double initialization
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            // Expose services globally
            window.authDB = firebase.auth();
            window.db = firebase.firestore();
            window.rtdb = firebase.database();

            // Set auth persistence — try LOCAL first, fall back to SESSION for iOS in-app browsers
            window.authDB.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {
                console.warn('LOCAL persistence failed, falling back to SESSION');
                return window.authDB.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            }).catch(function (err) {
                console.warn('Auth persistence setup failed:', err.message);
            });

            console.log('🔥 Firebase initialized');
        } catch (e) {
            console.error('Firebase init error:', e);
        }
    }
} else {
    console.error('Firebase SDK not loaded');
}
