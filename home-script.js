// Check if user is logged in when page loads
window.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    
    // If not logged in, redirect to login page
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    // Display username
    if (username) {
        document.getElementById('username').textContent = username;
    }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', function() {
    // Clear login status
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    
    // Redirect to login page
    window.location.href = 'index.html';
});

// Game card click handlers
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        card.querySelector('.play-btn').click();
    });
});

// Orb animation on mouse move
document.addEventListener('mousemove', e => {
    document.querySelectorAll('.orb').forEach((orb, i) => {
        const speed = (i + 1) * 20;
        orb.style.transform = `translate(${e.clientX / speed}px, ${e.clientY / speed}px)`;
    });
});