/**
 * Optimistic Session Guard
 * Handles instant redirects based on local session state before Firebase loads.
 * Prevents FOUC (Flash of Unauthenticated Content) and Redirect Lag.
 */
(function () {
    // Current path
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path === '/' || path.endsWith('/');
    const isProtectedPage = path.includes('dashboard.html') || path.includes('form.html') || path.includes('stats.html');

    // Check local session flag
    const hasSession = localStorage.getItem('krmu_session') === 'true';

    // 1. If logged in and on login page -> Go to Dashboard
    if (isLoginPage && hasSession) {
        window.location.replace('dashboard.html');
    }

    // 2. If not logged in and on protected page -> Go to Login
    if (isProtectedPage && !hasSession) {
        // Allow a small grace period for Firebase to potentially restore session if flag is missing but cookie exists?
        // No, strict mode is faster. Firebase will correct us if we are wrong (via auth.js).
        window.location.replace('index.html');
    }
})();
