// Authentication Module - Email/Password
import { showToast } from './ui.js';

// Wait for Firebase to load
const waitForFirebase = () => new Promise(resolve => {
    if (window.firebase && window.firebase.auth) {
        resolve(window.firebase);
    } else {
        const interval = setInterval(() => {
            if (window.firebase && window.firebase.auth) {
                clearInterval(interval);
                resolve(window.firebase);
            }
        }, 100);
    }
});

// Map Firebase errors to user-friendly messages
const getErrorMessage = (error) => {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many login attempts. Please try again later.';
        default:
            return error.message || 'Authentication error occurred.';
    }
};

export const auth = {
    // Sign Up
    async signUp(email, password) {
        const firebase = await waitForFirebase();
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign Up Error:', error);
            return { success: false, message: getErrorMessage(error) };
        }
    },

    // Sign In
    async signIn(email, password) {
        const firebase = await waitForFirebase();
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign In Error:', error);
            return { success: false, message: getErrorMessage(error) };
        }
    },

    // Sign Out
    async signOut() {
        const firebase = await waitForFirebase();
        try {
            await firebase.auth().signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign Out Error:', error);
            return { success: false, message: getErrorMessage(error) };
        }
    },

    // Password Reset
    async sendPasswordReset(email) {
        const firebase = await waitForFirebase();
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Reset Password Error:', error);
            return { success: false, message: getErrorMessage(error) };
        }
    },

    // Auth State Listener
    async onAuthStateChanged(callback) {
        const firebase = await waitForFirebase();
        return firebase.auth().onAuthStateChanged(callback);
    }
};
