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

    // Only redirect away from protected pages if not logged in
    // Don't auto-redirect TO dashboard from login page (let Firebase auth handle that)
    if (isProtectedPage && !hasSession) {
        window.location.replace('index.html');
    }
})();
