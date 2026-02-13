window.addEventListener('DOMContentLoaded', function () {
    if (!AuthManager.isAuthenticated()) {
        window.location.replace('index.html');
        return;
    }

    const user = AuthManager.getCurrentUser();

    const usernameElement = document.getElementById('username');
    if (user && user.username && usernameElement) {
        usernameElement.textContent = 'Welcome, ' + user.username;
    }

    setupLogoutButton();
    setupGameCards();
});

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');

    if (!logoutBtn) {
        console.error('Logout button not found');
        return;
    }

    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();

        if (confirm('Are you sure you want to logout?')) {
            AuthManager.logout();
            
            window.location.replace('index.html');
        }
    });
}

function setupGameCards() {
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (!e.target.classList.contains('play-btn') && !e.target.closest('.play-btn')) {
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

                setTimeout(() => {
                    const playBtn = this.querySelector('.play-btn');
                    if (playBtn) playBtn.click();
                }, 200);
            }
        });

        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.03)`;
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
}

document.addEventListener('mousemove', e => {
    document.querySelectorAll('.orb').forEach((orb, i) => {
        const speed = (i + 1) * 30;
        const x = (e.clientX / speed);
        const y = (e.clientY / speed);
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});

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