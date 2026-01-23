/* ============================================
   KRMU Green - Dashboard Logic
   Fetch user data & stats
   ============================================ */

import { showToast, escapeHtml } from './ui.js';

// DOM Elements
const elements = {
    userName: document.getElementById('userName'),
    totalImpact: document.getElementById('totalImpact'),
    volunteerCount: document.getElementById('volunteerCount'),
    myScore: document.getElementById('myScore'),
    deptLeaderboard: document.getElementById('deptLeaderboard'),
    pledgeList: document.getElementById('pledgeList'),
    logoutBtn: document.getElementById('logoutBtn')
};

/**
 * Initialize Dashboard
 */
async function initDashboard() {
    try {
        // 1. Fetch User Data (Auth Check)
        const user = await fetchUser();
        if (!user) {
            window.location.href = 'index.html'; // Redirect if not logged in
            return;
        }

        // Auth success: Show content
        document.body.classList.remove('auth-loading');

        elements.userName.textContent = user.displayName || user.email.split('@')[0] || 'Student';

        // 2. Fetch Dashboard Stats
        await fetchStats();

    } catch (error) {
        console.error('Dashboard init failed:', error);
        showToast('Error', 'Failed to load dashboard data', 'error');
    }
}

/**
 * Fetch Current User (Firebase Client-Side)
 */
function fetchUser() {
    return new Promise((resolve) => {
        // Wait for firebase SDK to load if needed
        const checkFirebase = setInterval(() => {
            if (window.authDB) { // window.authDB set in firebase-init.js
                clearInterval(checkFirebase);

                // Check auth state
                const unsubscribe = window.authDB.onAuthStateChanged(user => {
                    unsubscribe(); // Unsubscribe immediately, we just want current state
                    resolve(user);
                });
            } else if (window.firebase && window.firebase.auth) {
                clearInterval(checkFirebase);
                const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                    unsubscribe();
                    resolve(user);
                });
            }
        }, 100);

        // Timeout fallback
        setTimeout(() => {
            clearInterval(checkFirebase);
            resolve(null);
        }, 3000);
    });
}

const DEPARTMENTS = [
    'Computer Science', 'Law', 'Management', 'Engineering', 'Medical',
    'Fashion', 'Journalism', 'Basic Sciences', 'Architecture', 'Education', 'Other'
];

/**
 * Fetch Stats (Real-time Firestore)
 */
async function fetchStats() {
    // 1. Listen to Pledges Collection
    // Note: For large scale, we would use distributed counters. 
    // For this scale (< few thousand), client-side counting is acceptable.

    if (window.db) {
        // PLEDGES LISTENER
        window.db.collection('pledges').orderBy('timestamp', 'desc').onSnapshot(snap => {
            const pledges = [];
            snap.forEach(doc => pledges.push({ id: doc.id, ...doc.data() }));

            // Update Metrics
            updateMetrics(pledges);

            // Update Leaderboard
            updateLeaderboard(pledges);

            // Update Feed
            updateFeed(pledges.slice(0, 5)); // Recent 5

        }, err => console.error('Stats listener failed:', err));

    } else {
        console.error('Firestore not initialized');
    }
}

/**
 * Calculate & Update Top Cards
 */
function updateMetrics(pledges) {
    // Total Impact
    elements.totalImpact.textContent = pledges.length.toLocaleString();

    // Volunteers (Count where volunteer == "Yes")
    const volCount = pledges.filter(p => p.volunteer === 'Yes').length;
    elements.volunteerCount.textContent = volCount.toLocaleString();

    // My Score
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        const myPledges = pledges.filter(p => p.userId === currentUser.uid);
        const myTotal = myPledges.reduce((sum, p) => sum + (parseInt(p.score) || 0), 0);
        elements.myScore.textContent = myTotal;
    }
}

/**
 * Update Leaderboard (Group by Dept)
 */
function updateLeaderboard(pledges) {
    const deptScores = {};

    // Initialize
    DEPARTMENTS.forEach(d => deptScores[d] = 0);

    // Sum scores
    pledges.forEach(p => {
        const dept = p.department || 'Other';
        const score = parseInt(p.score) || 0;
        if (deptScores[dept] !== undefined) {
            deptScores[dept] += score;
        } else {
            deptScores['Other'] += score;
        }
    });

    // Sort & Rank
    const sortedDepts = Object.entries(deptScores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Top 5

    // Render
    if (sortedDepts.length > 0) {
        elements.deptLeaderboard.innerHTML = sortedDepts.map((dept, index) => `
            <tr>
                <td class="font-medium text-muted">#${index + 1}</td>
                <td>${escapeHtml(dept.name)}</td>
                <td class="text-right font-mono">${dept.score.toLocaleString()}</td>
            </tr>
        `).join('');
    } else {
        elements.deptLeaderboard.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data available</td></tr>';
    }
}

/**
 * Update Recent Activity Feed
 */
function updateFeed(recentPledges) {
    if (recentPledges.length > 0) {
        elements.pledgeList.innerHTML = recentPledges.map(p => {
            // Calculate time ago (simple approximation)
            let timeAgo = 'Just now';
            if (p.timestamp) {
                const diff = Date.now() - p.timestamp.toDate().getTime();
                const mins = Math.floor(diff / 60000);
                if (mins > 60) timeAgo = `${Math.floor(mins / 60)} hrs ago`;
                else if (mins > 0) timeAgo = `${mins} mins ago`;
            }

            // Initials
            const name = p.fullName || 'Anonymous';
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            return `
            <div class="flex items-center gap-3 p-2 hover:bg-muted/10 rounded-md transition-colors animate-slideUp">
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    ${initials}
                </div>
                <div class="flex-1">
                    <div class="text-sm font-medium">${escapeHtml(name)}</div>
                    <div class="text-xs text-muted">${escapeHtml(p.department)} • Score: ${p.score}</div>
                </div>
                <div class="text-xs text-muted">${timeAgo}</div>
            </div>
            `;
        }).join('');
    } else {
        elements.pledgeList.innerHTML = '<div class="text-center text-muted py-4">No recent activity</div>';
    }
}


function updateUI(stats) {
    // Deprecated - functions split above
}

/**
 * Logout handler
 */
if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', async () => {
        try {
            if (window.authDB) {
                await window.authDB.signOut();
            } else if (window.firebase && window.firebase.auth) {
                await firebase.auth().signOut();
            }
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed', error);
        }
    });
}

// Auto-run
initDashboard();
