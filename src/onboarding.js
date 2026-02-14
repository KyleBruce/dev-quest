const STEPS = [
  {
    target: '#click-btn',
    text: 'Tap the button to write code! Each tap = Lines of Code (LoC).',
    action: 'click', // advance when click-btn is clicked
  },
  {
    target: '#needs-bar',
    text: 'These are your needs. They decay over time — go to Items to eat and drink!',
    action: 'auto', // advance after delay
  },
  {
    target: '#panel-settings',
    text: 'Code Reviews queue up as you code — answer correctly for bonus XP and LoC!',
    action: 'auto',
  },
  {
    target: '#tab-bar',
    text: 'Use these tabs to buy upgrades, feed your dev, learn skills, and equip gear. Have fun!',
    action: 'auto',
  },
];

export function shouldShowOnboarding(state) {
  return !state.onboardingDone && state.totalLoc === 0 && !state.prestigeCount;
}

export function startOnboarding(onComplete) {
  let step = 0;

  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';

  const bubble = document.createElement('div');
  bubble.id = 'onboarding-bubble';

  const text = document.createElement('div');
  text.id = 'onboarding-text';

  const btnNext = document.createElement('button');
  btnNext.id = 'onboarding-next';
  btnNext.textContent = 'Got it!';

  const stepIndicator = document.createElement('div');
  stepIndicator.id = 'onboarding-step';

  bubble.appendChild(text);
  bubble.appendChild(stepIndicator);
  bubble.appendChild(btnNext);
  overlay.appendChild(bubble);
  document.body.appendChild(overlay);

  function showStep() {
    if (step >= STEPS.length) {
      overlay.remove();
      document.querySelectorAll('.onboarding-highlight').forEach((el) => el.classList.remove('onboarding-highlight'));
      onComplete();
      return;
    }

    const s = STEPS[step];
    text.textContent = s.text;
    stepIndicator.textContent = `${step + 1} / ${STEPS.length}`;

    // Highlight target
    document.querySelectorAll('.onboarding-highlight').forEach((el) => el.classList.remove('onboarding-highlight'));
    const target = document.querySelector(s.target);
    if (target) {
      target.classList.add('onboarding-highlight');
      // Position bubble near target
      const rect = target.getBoundingClientRect();
      const bubbleHeight = 160;
      if (rect.bottom + bubbleHeight + 20 < window.innerHeight) {
        bubble.style.top = (rect.bottom + 12) + 'px';
      } else {
        bubble.style.top = Math.max(10, rect.top - bubbleHeight - 12) + 'px';
      }
    }

    if (s.action === 'auto') {
      btnNext.style.display = 'block';
    } else {
      btnNext.style.display = 'block';
    }
  }

  btnNext.addEventListener('click', (e) => {
    e.stopPropagation();
    step++;
    showStep();
  });

  // Also advance on target click for first step
  document.getElementById('click-btn').addEventListener('click', () => {
    if (step === 0) {
      step++;
      showStep();
    }
  }, { once: true });

  showStep();
}
