/* assets/js/auth.js */

document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginError = document.getElementById('login-error');
    const regError = document.getElementById('reg-error');

    // Toggle Forms
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            loginBox.style.display = 'none';
            registerBox.style.display = 'block';
            loginError.style.display = 'none';
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            registerBox.style.display = 'none';
            loginBox.style.display = 'block';
            regError.style.display = 'none';
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Signing In...';
            btn.disabled = true;

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', username, password })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    window.location.href = data.redirect;
                } else {
                    loginError.textContent = data.message || 'Login failed.';
                    loginError.style.display = 'block';
                }
            } catch (err) {
                loginError.textContent = 'Network error occurred.';
                loginError.style.display = 'block';
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Signing Up...';
            btn.disabled = true;

            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const res = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'register', username, email, password })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    window.location.href = data.redirect;
                } else {
                    regError.textContent = data.message || 'Registration failed.';
                    regError.style.display = 'block';
                }
            } catch (err) {
                regError.textContent = 'Network error occurred.';
                regError.style.display = 'block';
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});
