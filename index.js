(() => {
    // Respect users' motion preferences
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect if device is actually a touch device (works even in desktop mode)
    const isTouchDevice = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0);

    // Add class to body for touch devices
    if (isTouchDevice) {
        document.documentElement.classList.add('touch-device');
    }

    /*
        OPTIONAL: Realtime online visitor presence using Firebase Realtime Database.
        To enable, create a Firebase project, enable Realtime Database, then set
        the FIREBASE_CONFIG below with your project's config object.
        Example:
        const FIREBASE_CONFIG = {
            apiKey: "...",
            authDomain: "...",
            databaseURL: "https://<your-db>.firebaseio.com",
            projectId: "...",
            storageBucket: "...",
            messagingSenderId: "...",
            appId: "..."
        };
    */
    const FIREBASE_CONFIG = null; // <-- replace null with your Firebase config object to enable realtime presence

    document.addEventListener('DOMContentLoaded', () => {
        const card = document.getElementById('card');
        const inner = card && card.querySelector('.card-inner');

        if (!card || !inner) return;

        // Check if device is mobile
        const isMobile = window.innerWidth <= 768;

        // Typing animation for bio text - only on desktop
        const bioElement = document.getElementById('bio-text');
        const bioText = '[ ACCESSING NEURAL LINK... WELCOME TO BYTE SIZE HUB ]';

        if (!isMobile && !prefersReduced) {
            let bioIndex = 0;

            function typeBio() {
                if (bioIndex < bioText.length && bioElement) {
                    bioElement.textContent = bioText.substring(0, bioIndex + 1);
                    bioIndex++;
                    setTimeout(typeBio, 50);
                }
            }

            // Start typing after a delay
            setTimeout(() => {
                if (bioElement) {
                    bioElement.textContent = '';
                    typeBio();
                }
            }, 1000);
        } else {
            // Show full text immediately on mobile
            if (bioElement) {
                bioElement.textContent = bioText;
            }
        }

        // Random glitch effect on profile name - only on desktop
        const nameElement = document.getElementById('profile-name');

        if (!isMobile && !prefersReduced) {
            function glitchEffect() {
                if (!nameElement) return;

                const originalText = 'BYTE SIZE';
                const glitchChars = '█▓▒░!@#$%^&*';
                let iterations = 0;

                const interval = setInterval(() => {
                    nameElement.textContent = originalText
                        .split('')
                        .map((char, index) => {
                            if (index < iterations) {
                                return originalText[index];
                            }
                            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                        })
                        .join('');

                    iterations += 1 / 3;

                    if (iterations >= originalText.length) {
                        clearInterval(interval);
                        nameElement.textContent = originalText;
                    }
                }, 30);
            }

            // Trigger glitch effect on load and periodically
            setTimeout(glitchEffect, 2000);
            setInterval(glitchEffect, 15000);
        }

        // Add hover sound effect simulation (visual feedback) - desktop only
        if (!isMobile) {
            const linkButtons = document.querySelectorAll('.link-button');
            linkButtons.forEach(button => {
                button.addEventListener('mouseenter', () => {
                    if (prefersReduced) return;
                    button.style.transition = 'all 150ms ease-out';
                });
            });
        }

        // Only enable pointer tilt on devices with a fine pointer (mouse) and sufficient width.
        const canTilt = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 900 && !prefersReduced;

        // Pointer-based tilt effect
        const bounds = { w: 0, h: 0 };

        function updateBounds() {
            const rect = card.getBoundingClientRect();
            bounds.w = rect.width; bounds.h = rect.height;
        }

        let rafId = null;
        let pointer = { x: 0, y: 0 };

        function applyTilt() {
            const px = (pointer.x / bounds.w) - 0.5; // -0.5 .. 0.5
            const py = (pointer.y / bounds.h) - 0.5;
            const rotX = (py) * 12; // tilt magnitude
            const rotY = (px) * -12;

            inner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
            inner.style.boxShadow = `0 ${20 - Math.abs(rotX)}px ${40 - Math.abs(rotY)}px rgba(2,6,23,0.55)`;
            rafId = null;
        }

        function onPointerMove(e) {
            if (prefersReduced) return;
            const rect = card.getBoundingClientRect();
            pointer.x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
            pointer.y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
            if (!rafId) rafId = requestAnimationFrame(applyTilt);
        }

        function resetTilt() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
            inner.style.transition = 'transform 450ms cubic-bezier(.2,.9,.2,1), box-shadow 300ms ease';
            inner.style.transform = '';
            inner.style.boxShadow = '';
            setTimeout(() => inner.style.transition = '', 500);
        }

        // Attach events
        updateBounds();
        window.addEventListener('resize', () => {
            updateBounds();
            // recalc tilt capability on resize
            // if viewport becomes smaller, ensure tilt is reset
            if (!(window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 900)) resetTilt();
        });

        if (canTilt && !prefersReduced) {
            card.addEventListener('mousemove', onPointerMove);
            card.addEventListener('touchmove', onPointerMove, { passive: true });
            card.addEventListener('mouseleave', resetTilt);
            card.addEventListener('touchend', resetTilt);
        } else {
            // ensure no transforms if we don't tilt (touch devices / small screens)
            inner.style.transform = '';
            inner.style.boxShadow = '';
        }

        // Keyboard accessibility: slightly lift card when focused via tab
        const links = card.querySelectorAll('.link-button');
        links.forEach(link => {
            link.addEventListener('focus', () => {
                inner.style.transform = 'translateY(-8px)';
            });
            link.addEventListener('blur', () => {
                inner.style.transform = '';
            });
        });

        // Reduce motion fallback: disable tilt
        if (prefersReduced) {
            card.classList.add('reduced-motion');
        }

        /* ---------------- Firebase Realtime Presence (optional) ---------------- */
        (function setupFirebasePresence() {
            if (!FIREBASE_CONFIG) return; // no config provided
            if (typeof firebase === 'undefined' || !firebase.database) {
                console.warn('Firebase SDK not loaded or incompatible. Presence disabled.');
                return;
            }

            try {
                const app = firebase.initializeApp(FIREBASE_CONFIG);
                const db = firebase.database();
                const presenceRef = db.ref('presence');

                // Create a unique id for this client
                const clientId = `c_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                const myRef = presenceRef.child(clientId);

                // Set presence when connected; remove on disconnect
                const connectedRef = db.ref('.info/connected');
                connectedRef.on('value', snap => {
                    if (snap.val() === true) {
                        myRef.set({ ts: firebase.database.ServerValue.TIMESTAMP });
                        myRef.onDisconnect().remove();
                    }
                });

                // Listen for presence count changes
                presenceRef.on('value', snapshot => {
                    const count = snapshot.numChildren();
                    const el = document.getElementById('online-count');
                    if (el) el.textContent = String(count);
                });
            } catch (err) {
                console.warn('Firebase presence setup failed', err);
            }
        })();
    });
})();
