document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.link-button');

    buttons.forEach(button => {
        button.addEventListener('mousedown', () => {
            // Add a class when the button is pressed
            button.style.transform = 'scale(0.98)';
        });

        button.addEventListener('mouseup', () => {
            // Remove the class when the button is released
            button.style.transform = 'scale(1.05)';
        });

        // Handle case if mouse leaves button while pressed
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1.05)';
        });

        // Reset to normal hover state
         button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
        });
    });
});