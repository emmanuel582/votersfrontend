export const triggerGoldParticles = (x: number, y: number) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 6 + 4; // 4px to 10px
    particle.style.position = 'absolute';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = 'var(--color-gold)';
    particle.style.borderRadius = '50%';
    particle.style.boxShadow = '0 0 10px var(--color-gold-glow)';
    
    // Calculate random outward trajectory
    const angle = (Math.PI * 2 * i) / 12 + (Math.random() * 0.5);
    const velocity = Math.random() * 100 + 80;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity - 50; // Slight upward bias

    particle.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
    ], {
      duration: 800 + Math.random() * 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      fill: 'forwards'
    });

    container.appendChild(particle);
  }

  // Cleanup
  setTimeout(() => {
    container.remove();
  }, 1200);
};
