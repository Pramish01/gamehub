window.addEventListener('DOMContentLoaded', function () {
    if (AuthManager.isAuthenticated()) {
        window.location.href = 'home.html';
    }
});

document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const result = AuthManager.login(email, username, password);

    if (result.success) {
        showMessage('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1000);
    } else {
        showMessage(result.message, 'error');
    }
});

function showMessage(message, type) {
    const existingMessage = document.querySelector('.message-box');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageBox = document.createElement('div');
    messageBox.className = `message-box ${type}`;
    messageBox.textContent = message;

    messageBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    if (type === 'success') {
        messageBox.style.background = 'linear-gradient(135deg, #00ff87, #00f3ff)';
        messageBox.style.color = '#0a0e27';
    } else {
        messageBox.style.background = 'linear-gradient(135deg, #ff006e, #ff4d4d)';
        messageBox.style.color = '#fff';
    }

    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageBox.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('mousemove', e => {
    document.querySelectorAll('.orb').forEach((orb, i) => {
        const speed = (i + 1) * 30;
        const x = (e.clientX / speed);
        const y = (e.clientY / speed);
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});