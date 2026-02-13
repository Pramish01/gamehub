document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;

    if (!terms) {
        showMessage('Please accept the Terms & Conditions', 'error');
        return;
    }

    if (firstname.length < 2 || lastname.length < 2) {
        showMessage('First and last name must be at least 2 characters', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        showMessage('Username must be 3-20 characters (letters, numbers, underscore only)', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }

    const existingUsername = localStorage.getItem('registered_username');
    if (existingUsername === username) {
        showMessage('Username already taken. Please choose another.', 'error');
        return;
    }

    localStorage.setItem('registered_username', username);
    localStorage.setItem('registered_email', email);
    localStorage.setItem('registered_password', password); 

    showMessage('Account created successfully! Redirecting to login...', 'success');

    setTimeout(() => {
        window.location.href = 'index.html';  
    }, 2000);
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
        max-width: 400px;
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

document.getElementById('password').addEventListener('input', function () {
    const password = this.value;
    let strength = 0;
    let strengthText = '';
    let strengthColor = '';

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    let indicator = document.getElementById('password-strength');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'password-strength';
        indicator.style.cssText = `
            margin-top: 0.5rem;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
        `;
        this.parentElement.appendChild(indicator);
    }

    if (password.length === 0) {
        indicator.style.display = 'none';
        return;
    }

    indicator.style.display = 'block';

    if (strength <= 1) {
        strengthText = '💀 Weak Password';
        strengthColor = 'rgba(255, 0, 110, 0.2)';
        indicator.style.color = '#ff006e';
    } else if (strength <= 3) {
        strengthText = '⚠️ Medium Password';
        strengthColor = 'rgba(255, 165, 0, 0.2)';
        indicator.style.color = '#ffa500';
    } else {
        strengthText = '✅ Strong Password';
        strengthColor = 'rgba(0, 255, 135, 0.2)';
        indicator.style.color = '#00ff87';
    }

    indicator.textContent = strengthText;
    indicator.style.background = strengthColor;
});

document.addEventListener('mousemove', e => {
    document.querySelectorAll('.orb').forEach((orb, i) => {
        const speed = (i + 1) * 30;
        const x = (e.clientX / speed);
        const y = (e.clientY / speed);
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});


window.addEventListener('load', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

const loginBox = document.querySelector('.login-box');
if (loginBox) {
    loginBox.style.scrollBehavior = 'smooth';
}