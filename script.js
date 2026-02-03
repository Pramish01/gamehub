document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        card.querySelector('.play-btn').click();
    });
});

document.addEventListener('mousemove', e => {
    document.querySelectorAll('.orb').forEach((orb, i) => {
        const speed = (i + 1) * 20;
        orb.style.transform = `translate(${e.clientX / speed}px, ${e.clientY / speed}px)`;
    });
});
