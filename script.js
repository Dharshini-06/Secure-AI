document.getElementById('scan-btn').addEventListener('click', analyzeURL);

// Also allow Enter key to trigger scan
document.getElementById('url-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        analyzeURL();
    }
});

// Quick Test function
function quickTest(url) {
    document.getElementById('url-input').value = url;
    analyzeURL();
}

let currentAnalyzedUrl = '';

function analyzeURL() {
    let urlInput = document.getElementById('url-input').value.trim();
    if (!urlInput) {
        alert('Please enter a valid URL to open securely.');
        return;
    }

    // Add protocol if missing for analysis
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
        urlInput = 'https://' + urlInput; // Assume secure if not specified
    }

    currentAnalyzedUrl = urlInput;

    const loading = document.getElementById('loading');
    const searchSection = document.getElementById('search-section');
    const heroImg = document.getElementById('hero-img');
    const mainHeader = document.getElementById('main-header');
    const statusText = document.getElementById('status-text');

    // Reset view
    loading.style.display = 'block';
    searchSection.style.display = 'none';
    mainHeader.style.display = 'none';
    statusText.innerText = '🔍 Scanning website...';

    // [STRICT DEBUGGING] TRIGGER BACKEND LOGGING
    console.log("🔥 Triggering analysis for:", urlInput);

    fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput })
    })
        .then(res => res.json())
        .then(data => {
            console.log("✅ Analysis stored in DB:", data);
            alert("Scan event triggered! Check server terminal.");
        })
        .catch(err => {
            console.error("❌ API ERROR:", err);
            alert("API connection failed. See console.");
        });

    // Simulate scanning (Frontend Visual Effects)
    setTimeout(() => {
        statusText.innerText = 'AI analyzing patterns...';
        setTimeout(() => {
            const report = performSecurityChecks(urlInput);
            loading.style.display = 'none';
            showResultPage(report);

            if (report.score <= 60) {
                // Safe - Setup auto-redirect
                const redirectMsg = document.getElementById('redirect-msg');
                redirectMsg.style.display = 'block';
                setTimeout(() => {
                    window.location.href = urlInput;
                }, 2000);
            }
        }, 1500);
    }, 500);
}

function performSecurityChecks(url) {
    let score = 0;
    const issues = [];
    const lowerUrl = url.toLowerCase();

    // 1. HTTPS Check
    if (lowerUrl.startsWith('https://')) {
        issues.push({ text: 'Secure connection (SSL enabled)', type: 'positive' });
    } else {
        score += 30;
        issues.push({ text: 'Connection not secure (No SSL)', type: 'negative' });
    }

    // 2. Length Check
    if (url.length > 50) {
        score += 20;
        issues.push({ text: 'URL length exceeds safety threshold (+20)', type: 'negative' });
    }

    // 3. Suspicious Keywords
    const keywords = ['login', 'verify', 'secure', 'update', 'account', 'bank'];
    keywords.forEach(kw => {
        if (lowerUrl.includes(kw)) {
            score += 15;
            issues.push({ text: 'Found suspicious keyword: ' + kw + ' (+15)', type: 'negative' });
        }
    });

    // 4. Special Characters (@)
    if (url.includes('@')) {
        score += 25;
        issues.push({ text: 'Unsafe special character detected: @ (+25)', type: 'negative' });
    }

    // 5. Multiple Subdomains
    const dotCount = (url.split('.').length - 1);
    if (dotCount > 3) {
        score += 10;
        issues.push({ text: 'Multiple subdomains present (Phishing risk) (+10)', type: 'negative' });
    }

    // 6. Password Input Simulation
    let passwordSim = false;
    if (lowerUrl.includes('login') || lowerUrl.includes('auth') || lowerUrl.includes('signin')) {
        score += 20;
        issues.push({ text: 'Password input field detected (Simulated) (+20)', type: 'negative' });
        passwordSim = true;
    }

    // AI Verdict and Confidence calculation
    let verdict = 'Safe Website';
    let confidence = 0;
    let styleClass = 'safe';

    if (score >= 61) {
        verdict = 'Unsafe Website';
        confidence = 90 + Math.floor((score - 61) / 39 * 10);
        styleClass = 'unsafe';
    } else if (score >= 31) {
        verdict = 'Suspicious Website';
        confidence = 70 + Math.floor((score - 31) / 29 * 19);
        styleClass = 'suspicious';
    } else {
        verdict = 'Safe Website';
        confidence = 50 + Math.floor(score / 31 * 19);
        styleClass = 'safe';
    }

    // Final safety cap
    confidence = Math.min(confidence, 100);

    return {
        score: Math.min(score, 100),
        verdict: verdict,
        confidence: confidence,
        styleClass: styleClass,
        issues: issues.length > 0 ? issues : [{ text: 'No immediate threats detected.', type: 'positive' }],
        metadata: {
            protocol: lowerUrl.startsWith('https://') ? 'HTTPS' : 'HTTP',
            isSecure: lowerUrl.startsWith('https://'),
            keywordCount: keywords.filter(kw => lowerUrl.includes(kw)).length,
            isLong: url.length > 50,
            hasSpecialChar: url.includes('@'),
            dotCount: dotCount,
            passwordSim: passwordSim
        }
    };
}

function showResultPage(report) {
    const resultPage = document.getElementById('result-page');
    const resultCard = document.getElementById('result-card-ui');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resScore = document.getElementById('res-score');
    const resVerdict = document.getElementById('res-verdict');
    const resIssues = document.getElementById('res-issues');
    const proceedBtn = document.getElementById('proceed-btn');
    const redirectMsg = document.getElementById('redirect-msg');

    // Reset components
    resultCard.className = 'result-card-main ' + report.styleClass;
    resultTitle.className = report.styleClass;
    redirectMsg.style.display = 'none';

    if (report.styleClass === 'safe') {
        resultIcon.innerText = '✅';
        resultTitle.innerText = 'Website is Safe';
        proceedBtn.style.display = 'none';
    } else {
        resultIcon.innerText = '🚫';
        resultTitle.innerText = 'Access Blocked – ' + report.verdict;
        proceedBtn.style.display = 'block';
    }

    resScore.innerText = report.score;
    resVerdict.innerText = report.verdict;

    // Apply color classes to score and verdict
    resScore.className = 'stat-value ' + report.styleClass;
    resVerdict.className = 'stat-value ' + report.styleClass;

    // Setup Proceed Button
    proceedBtn.onclick = () => {
        window.location.href = currentAnalyzedUrl;
    };

    // Confidence info
    let confidenceEl = document.getElementById('confidence-info-res');
    if (!confidenceEl) {
        confidenceEl = document.createElement('p');
        confidenceEl.id = 'confidence-info-res';
        confidenceEl.style.color = 'var(--text-secondary)';
        confidenceEl.style.fontSize = '0.9rem';
        confidenceEl.style.marginTop = '10px';
        document.querySelector('.warning-stats').appendChild(confidenceEl);
    }
    confidenceEl.innerText = `Decision Confidence: ${report.confidence}%`;

    resIssues.innerHTML = '';
    document.getElementById('res-log-title').innerText = 'Why this decision? (Detection Log)';

    report.issues.forEach(issue => {
        const li = document.createElement('li');
        li.className = issue.type;
        li.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg><span>' + issue.text + '</span>';
        resIssues.appendChild(li);
    });

    resultPage.style.display = 'block';
    updateFeatureCards(report, report.score <= 60 ? 'Redirected' : 'Blocked');
}

function updateFeatureCards(report, actionTaken) {
    const meta = report.metadata;

    // 1. HTTPS Card
    const httpsCard = document.getElementById('https-details');
    if (httpsCard) {
        httpsCard.innerHTML = `
            • Status: ${meta.isSecure ? 'Secure' : 'Not Secure'}<br>
            • Protocol: ${meta.protocol}<br>
            • SSL: ${meta.isSecure ? 'Active SSL' : 'Missing SSL'}<br>
            • Impact: ${meta.isSecure ? 'Safe' : '+30 risk added'}
        `;
    }

    // 2. Phishing Card
    const phishCard = document.getElementById('phish-details');
    if (phishCard) {
        phishCard.innerHTML = `
            • Keywords: ${meta.keywordCount} found<br>
            • Length: ${meta.isLong ? 'Suspicious' : 'Normal'}<br>
            • Symbols: ${meta.hasSpecialChar ? '@ detected' : 'None'}<br>
            • Indicators: ${meta.dotCount} dots found
        `;
    }

    // 3. AI Analysis Card
    const aiCard = document.getElementById('ai-details');
    if (aiCard) {
        const riskLevel = report.score > 60 ? 'High' : (report.score > 30 ? 'Medium' : 'Low');
        aiCard.innerHTML = `
            • Verdict: ${report.verdict}<br>
            • Score: ${report.score}/100<br>
            • Confidence: ${report.confidence}%<br>
            • Level: ${riskLevel}<br>
            • Action: ${actionTaken}
        `;
    }
}
function goBack() {
    document.getElementById('result-page').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('search-section').style.display = 'block';
    document.getElementById('main-header').style.display = 'block';

    // Reset feature cards to static content
    const httpsCard = document.getElementById('https-details');
    if (httpsCard) httpsCard.innerHTML = 'Detects missing SSL certificates that expose your data.';

    const phishCard = document.getElementById('phish-details');
    if (phishCard) phishCard.innerHTML = 'Identifies suspicious keywords often used in scams.';

    const aiCard = document.getElementById('ai-details');
    if (aiCard) aiCard.innerHTML = 'Evaluates URL structure for hidden redirection tactics.';
}

/* --- EXTENDED BACKEND INTEGRATION & DASHBOARD LOGIC --- */

const API_BASE = 'http://localhost:8000';

let dashboardData = JSON.parse(localStorage.getItem('secureAIData')) || {
    urlsScanned: 0,
    phishingMsg: 0,
    weakPwd: 0,
    threatsBlocked: 0,
    history: []
};

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).style.display = 'block';
    if (btn) btn.classList.add('active');

    if (tabId === 'dashboard-tab') {
        renderDashboard();
    }
}

function logActivity(action, result) {
    dashboardData.history.unshift({ action, result, time: new Date().toLocaleTimeString() });
    if (dashboardData.history.length > 20) dashboardData.history.pop();
}

function saveData() {
    localStorage.setItem('secureAIData', JSON.stringify(dashboardData));
}

// Intercept existing URL check to record stats without modifying original core behavior much
const originalPerformSecurityChecks = performSecurityChecks;
performSecurityChecks = function (url) {
    const report = originalPerformSecurityChecks(url);
    dashboardData.urlsScanned++;
    if (report.score > 60) dashboardData.threatsBlocked++;
    logActivity(`URL Scan: ${url.substring(0, 30)}...`, report.verdict);
    saveData();
    return report;
};

// --- Message Scanner Logic ---
async function analyzeMessage() {
    const msg = document.getElementById('message-input').value.trim();
    if (!msg) return alert('Enter a message to analyze.');

    document.getElementById('msg-loading').style.display = 'block';
    document.getElementById('msg-result-page').style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/analyze-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();

        document.getElementById('msg-loading').style.display = 'none';

        document.getElementById('msg-verdict').innerText = data.status.toUpperCase();
        document.getElementById('msg-verdict').style.color = data.status === 'phishing' ? 'var(--danger)' : (data.status === 'suspicious' ? 'var(--warning)' : 'var(--success)');
        document.getElementById('msg-confidence').innerText = data.confidence + '%';

        const issuesUl = document.getElementById('msg-issues');
        issuesUl.innerHTML = '';
        data.reasons.forEach(r => {
            issuesUl.innerHTML += `<li class="negative"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${r}</span></li>`;
        });
        if (data.reasons.length === 0) {
            issuesUl.innerHTML = `<li class="positive"><svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>No suspicious patterns found in text.</span></li>`;
        }

        document.getElementById('msg-result-page').style.display = 'block';

        if (data.status === 'phishing') dashboardData.phishingMsg++;
        logActivity('Message Scanned', data.status.toUpperCase());
        saveData();

    } catch (e) {
        document.getElementById('msg-loading').style.display = 'none';
        console.error(e);
        alert('Backend connection failed! Ensure FastAPI server is running gracefully.');
    }
}

// --- Password Checker Logic ---
async function checkPassword() {
    const pwd = document.getElementById('password-input').value;
    if (!pwd) return alert('Enter a password.');

    document.getElementById('pwd-loading').style.display = 'block';
    document.getElementById('pwd-result-page').style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/check-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();

        document.getElementById('pwd-loading').style.display = 'none';

        document.getElementById('pwd-strength').innerText = data.strength;
        document.getElementById('pwd-strength').style.color = data.strength === 'Weak' ? 'var(--danger)' : (data.strength === 'Medium' ? 'var(--warning)' : 'var(--success)');

        document.getElementById('pwd-risk').innerText = data.risk_status;
        document.getElementById('pwd-risk').style.color = data.risk_status === 'High Risk' ? 'var(--danger)' : 'var(--success)';

        document.getElementById('pwd-details').innerText = data.details;

        document.getElementById('pwd-result-page').style.display = 'block';

        if (data.strength === 'Weak') dashboardData.weakPwd++;
        logActivity('Password Checked', data.strength);
        saveData();

    } catch (e) {
        document.getElementById('pwd-loading').style.display = 'none';
        console.error(e);
        alert('Backend connection failed! Ensure FastAPI server is running gracefully.');
    }
}

// --- Dashboard & Charts Logic ---
let chartsInst = {};
function renderDashboard() {
    // Populate stats
    document.getElementById('dash-urls').innerText = dashboardData.urlsScanned;
    document.getElementById('dash-phish').innerText = dashboardData.phishingMsg;
    document.getElementById('dash-pwd').innerText = dashboardData.weakPwd;
    document.getElementById('dash-blocked').innerText = dashboardData.threatsBlocked;

    // Populate activity list
    const activityUl = document.getElementById('activity-list');
    activityUl.innerHTML = '';
    dashboardData.history.forEach(item => {
        activityUl.innerHTML += `
            <li style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">${item.action}</span>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="color: var(--accent-primary); font-size: 0.9rem;">${item.time}</span>
                    <span style="background: rgba(0,245,255,0.1); padding: 5px 10px; border-radius: 5px; font-size: 0.9rem;">${item.result}</span>
                </div>
            </li>
        `;
    });

    if (dashboardData.history.length === 0) {
        activityUl.innerHTML = '<li style="color: var(--text-secondary); text-align: center; padding: 20px;">No activity logged yet.</li>';
    }

    initCharts();
}

function initCharts() {
    Chart.defaults.color = '#c0c0c0';
    Chart.defaults.font.family = 'Outfit';

    if (chartsInst.pie) chartsInst.pie.destroy();
    if (chartsInst.bar) chartsInst.bar.destroy();
    if (chartsInst.line) chartsInst.line.destroy();

    const safeUrls = dashboardData.urlsScanned - dashboardData.threatsBlocked;

    // 1. Pie Chart
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    chartsInst.pie = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Safe Scans', 'Blocked Threats'],
            datasets: [{
                data: [Math.max(0, safeUrls), dashboardData.threatsBlocked],
                backgroundColor: ['#00ff88', '#ff4d4d'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#ffffff' } },
                title: { display: true, text: 'URL Threat Ratio', color: '#00f5ff', font: { size: 16 } }
            }
        }
    });

    // 2. Bar Chart
    const ctxBar = document.getElementById('barChart').getContext('2d');
    chartsInst.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['URL Threats', 'Phishing Msgs', 'Weak Pwds'],
            datasets: [{
                label: 'Detections Count',
                data: [dashboardData.threatsBlocked, dashboardData.phishingMsg, dashboardData.weakPwd],
                backgroundColor: ['#ff4d4d', '#ffb84d', '#7000ff'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Threat Breakdown Vector', color: '#00f5ff', font: { size: 16 } }
            },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
        }
    });

    // 3. Line Chart
    let lineData = [];
    let currentScore = 0;
    // Simulate trend based on events
    dashboardData.history.forEach((h, i) => {
        if (h.result.includes('UNSAFE') || h.result.includes('PHISHING') || h.result.includes('Weak')) currentScore += 10;
        else currentScore = Math.max(0, currentScore - 5);
        lineData.push(currentScore);
    });

    const ctxLine = document.getElementById('lineChart').getContext('2d');
    chartsInst.line = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: dashboardData.history.map((_, i) => '#' + (i + 1)).reverse(),
            datasets: [{
                label: 'Threat Intensity Trend',
                data: lineData.reverse(),
                borderColor: '#00f5ff',
                backgroundColor: 'rgba(0, 245, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Security Activity Trend (Recent)', color: '#00f5ff', font: { size: 16 } }
            },
            scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
    });
}
