(() => {
    // Respect users' motion preferences
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', () => {
        const card = document.getElementById('card');
        const inner = card && card.querySelector('.card-inner');

        if (!card || !inner) return;

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
        window.addEventListener('resize', updateBounds);
        card.addEventListener('mousemove', onPointerMove);
        card.addEventListener('touchmove', onPointerMove, { passive: true });
        card.addEventListener('mouseleave', resetTilt);
        card.addEventListener('touchend', resetTilt);

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
    });
})();
