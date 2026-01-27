/* ============================================
   KRMU Green - Dashboard Logic
   Fetch user data & stats
   ============================================ */

import { showToast, escapeHtml } from './ui.js';
window.showToast = showToast; // Expose for HTML inline onclick

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

// Expose Volunteer Handler
window.handleVolunteer = async function () {
    const btn = document.getElementById('volunteerBtn');
    if (btn && btn.disabled) return;

    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Please log in first', 'error');
        return;
    }

    try {
        const volunteerData = {
            userId: user.uid,
            fullName: user.displayName || user.email.split('@')[0],
            department: 'Volunteer',
            score: 0,
            volunteer: 'Yes',
            type: 'volunteer',
            status: 'volunteered',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        await window.db.collection('pledges').add(volunteerData);
        showToast('Thanks for volunteering!', 'success');

        // Disable button immediately with timestamp
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="text-xl">✅</span><span class="text-sm font-medium">Volunteered</span><span class="text-xs text-muted">Just now</span>`;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } catch (error) {
        console.error('Volunteer error:', error);
        showToast('Error saving: ' + error.message, 'error');
    }
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

        // 2. Check Volunteer Status
        checkVolunteerStatus(user.uid);

        // 3. Check Quiz Status
        checkQuizStatus(user.uid);

        // 4. Fetch Dashboard Stats
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

/**
 * Check if user already volunteered
 */
async function checkVolunteerStatus(userId) {
    if (!window.db) return;
    const btn = document.getElementById('volunteerBtn');
    if (!btn) return;

    try {
        const snap = await window.db.collection('pledges')
            .where('userId', '==', userId)
            .where('volunteer', '==', 'Yes')
            .get();

        if (!snap.empty) {
            const volunteerDoc = snap.docs[0].data();
            let timeAgoText = '';
            
            if (volunteerDoc.timestamp) {
                try {
                    const date = volunteerDoc.timestamp.toDate();
                    const diff = Date.now() - date.getTime();
                    const mins = Math.floor(diff / 60000);
                    const hours = Math.floor(mins / 60);
                    const days = Math.floor(hours / 24);

                    if (days > 0) timeAgoText = `${days}d ago`;
                    else if (hours > 0) timeAgoText = `${hours}h ago`;
                    else if (mins > 0) timeAgoText = `${mins}m ago`;
                    else timeAgoText = 'Just now';
                } catch (e) {
                    timeAgoText = '';
                }
            }

            btn.disabled = true;
            btn.innerHTML = `<span class="text-xl">✅</span><span class="text-sm font-medium">Volunteered</span>${timeAgoText ? `<span class="text-xs text-muted">${timeAgoText}</span>` : ''}`;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } catch (e) {
        console.error("Error checking volunteer status", e);
    }
}

/**
 * Check if user already submitted quiz
 */
async function checkQuizStatus(userId) {
    if (!window.db) return;
    const btn = document.getElementById('takeQuizBtn');
    if (!btn) return;

    try {
        const snap = await window.db.collection('pledges')
            .where('userId', '==', userId)
            .where('status', '==', 'submitted')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!snap.empty) {
            const quizDoc = snap.docs[0].data();
            const score = quizDoc.score ?? 0;
            let timeAgoText = '';
            
            if (quizDoc.timestamp) {
                try {
                    const date = quizDoc.timestamp.toDate();
                    const diff = Date.now() - date.getTime();
                    const mins = Math.floor(diff / 60000);
                    const hours = Math.floor(mins / 60);
                    const days = Math.floor(hours / 24);

                    if (days > 0) timeAgoText = `${days}d ago`;
                    else if (hours > 0) timeAgoText = `${hours}h ago`;
                    else if (mins > 0) timeAgoText = `${mins}m ago`;
                    else timeAgoText = 'Just now';
                } catch (e) {
                    timeAgoText = '';
                }
            }

            // Handle both button and anchor elements
            if (btn.tagName === 'A') {
                btn.removeAttribute('href');
                btn.style.pointerEvents = 'none';
            } else {
                btn.disabled = true;
            }
            btn.innerHTML = `<span class="text-xl">✅</span><span class="text-sm font-medium">Quiz Done • ${score} pts</span>${timeAgoText ? `<span class="text-xs text-muted">${timeAgoText}</span>` : ''}`;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } catch (e) {
        console.error("Error checking quiz status", e);
    }
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
        // PLEDGES LISTENER - OPTIMIZED WITH LIMIT
        window.db.collection('pledges').orderBy('timestamp', 'desc').limit(100).onSnapshot(snap => {
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
    // Total Impact (Approximate if limited)
    // For real total with limit, use a separate counter document in production.
    elements.totalImpact.textContent = (pledges.length >= 100 ? "100+" : pledges.length).toLocaleString();

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
            // Calculate time ago using ui.js utility or fallback
            let timeAgoText = 'Just now';
            if (p.timestamp || p.createdAt) {
                const ts = p.createdAt || p.timestamp;
                try {
                    const date = ts.toDate();
                    const diff = Date.now() - date.getTime();
                    const mins = Math.floor(diff / 60000);
                    const hours = Math.floor(mins / 60);
                    const days = Math.floor(hours / 24);

                    if (days > 0) timeAgoText = `${days} day${days > 1 ? 's' : ''} ago`;
                    else if (hours > 0) timeAgoText = `${hours} hr${hours > 1 ? 's' : ''} ago`;
                    else if (mins > 0) timeAgoText = `${mins} min${mins > 1 ? 's' : ''} ago`;
                } catch (e) {
                    console.warn('Error parsing timestamp:', e);
                }
            }

            // Get name with fallback
            const name = p.userName || p.fullName || 'Anonymous';
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const dept = p.department || 'General';
            const score = p.score ?? 0;
            
            // Determine entry type and styling
            const isVolunteer = p.volunteer === 'Yes' || p.type === 'volunteer';
            const avatarBgClass = isVolunteer ? 'bg-volunteer-10' : 'bg-primary-10';
            const avatarIcon = isVolunteer ? '🤝' : initials;
            const avatarTextClass = isVolunteer ? '' : 'text-primary font-bold text-sm';
            const statusText = isVolunteer 
                ? 'Volunteered' 
                : `${escapeHtml(dept)} • Score: ${score}`;

            return `
            <div class="flex items-center gap-3 p-2 hover-bg-muted rounded-md transition-colors animate-slideUp">
                <div class="flex items-center justify-center w-10 h-10 rounded-full ${avatarBgClass} ${avatarTextClass}">
                    ${avatarIcon}
                </div>
                <div class="flex-1">
                    <div class="text-sm font-medium">${escapeHtml(name)}</div>
                    <div class="text-xs text-muted">${statusText}</div>
                </div>
                <div class="text-xs text-muted">${timeAgoText}</div>
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
            // Immediate optimistic cleanup
            localStorage.removeItem('krmu_session');

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
