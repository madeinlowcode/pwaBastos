document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.footer-nav .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            // Prevent default behavior
            event.preventDefault();
            
            // Get the href attribute
            const href = item.getAttribute('href');
            
            // Navigate to the page
            window.location.href = href;
            
            // Log for debugging
            console.log('Navigating to:', href);
        });
    });
});
