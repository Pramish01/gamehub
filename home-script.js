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
    // Confirm logout
    if (confirm('Are you sure you want to logout?')) {
        // Clear login status
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
});

// Enhanced game card interactions
document.querySelectorAll('.game-card').forEach(card => {
    // Add ripple effect on click
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('play-btn')) {
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.width = '100px';
            ripple.style.height = '100px';
            ripple.style.left = e.offsetX - 50 + 'px';
            ripple.style.top = e.offsetY - 50 + 'px';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Trigger play button click after ripple
            setTimeout(() => {
                this.querySelector('.play-btn').click();
            }, 200);
        }
    });
    
    // Add tilt effect on mouse move
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.03)`;
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// Orb animation on mouse move
document.addEventListener('mousemove', e => {
    document.querySelectorAll('.orb').forEach((orb, i) => {
        const speed = (i + 1) * 30;
        const x = (e.clientX / speed);
        const y = (e.clientY / speed);
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Prevent default link behavior for game cards
document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});