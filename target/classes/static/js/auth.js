// Auth page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Password confirmation validation
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('password-error');

            if (password !== confirm) {
                e.preventDefault();
                errorEl.textContent = '⚠️ Passwords do not match!';
                document.getElementById('confirm-password').style.borderColor = '#ff4444';
            }
        });

        document.getElementById('confirm-password')?.addEventListener('input', () => {
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('password-error');

            if (confirm && password !== confirm) {
                errorEl.textContent = '⚠️ Passwords do not match!';
            } else {
                errorEl.textContent = '';
                document.getElementById('confirm-password').style.borderColor = '';
            }
        });
    }

    // Add film grain effect
    addFilmGrain();
});

function addFilmGrain() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        opacity: 0.03; mix-blend-mode: overlay;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function animate() {
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 255;
            data[i] = data[i+1] = data[i+2] = noise;
            data[i+3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(animate);
    }
    animate();
}
