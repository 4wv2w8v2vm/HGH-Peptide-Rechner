document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    let currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
            updateCalculations();
        });
    });

    // Setup buttons
    ['peptide', 'hgh', 'hcg'].forEach(type => setupOptionButtons(type));

    // Sync sliders
    ['peptide', 'hgh', 'hcg'].forEach(type => {
        syncInputs(type + '-dose', type + '-dose-slider');
    });

    const syringeType = document.getElementById('syringe-type');
    syringeType.addEventListener('change', updateCalculations);

    setupCustomInputs();

    function setupOptionButtons(type) {
        const buttons = document.querySelectorAll(`#${type}-tab .option-btn`);
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.closest('.options');
                group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const inputGroup = btn.closest('.input-group');
                const custom = inputGroup.querySelector('.custom-input');
                if (custom) {
                    custom.style.display = btn.dataset.value === 'custom' ? 'block' : 'none';
                }
                updateCalculations();
            });
        });
    }

    function setupCustomInputs() {
        document.querySelectorAll('.custom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const inputGroup = btn.closest('.input-group');
                const custom = inputGroup.querySelector('.custom-input');
                if (custom) custom.style.display = 'block';
            });
        });
    }

    function syncInputs(numId, sliderId) {
        const num = document.getElementById(numId);
        const slider = document.getElementById(sliderId);
        if (!num || !slider) return;

        num.addEventListener('input', () => { slider.value = num.value; updateCalculations(); });
        slider.addEventListener('input', () => { num.value = slider.value; updateCalculations(); });
    }

    function getVialAmount(type) {
        const active = document.querySelector(`#${type}-tab .option-btn.active`);
        if (!active) return type === 'hcg' ? 5000 : 10;
        if (active.dataset.value === 'custom') {
            return parseFloat(document.getElementById(type + '-custom-iu' || type + '-custom-mg').value) || (type === 'hcg' ? 5000 : 10);
        }
        return parseFloat(active.dataset.value) || 10;
    }

    function getBacWater(type) {
        const tab = document.getElementById(type + '-tab');
        const groups = tab.querySelectorAll('.options');
        const bacGroup = groups[1];
        if (!bacGroup) return 1;
        const active = bacGroup.querySelector('.option-btn.active');
        if (!active) return 1;
        if (active.dataset.value === 'custom') {
            return parseFloat(document.getElementById(type + '-custom-ml').value) || 1;
        }
        return parseFloat(active.dataset.value) || 1;
    }

    function updateCalculations() {
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;
        const type = activeTab.id.replace('-tab', '');
        const syringeTypeSelect = document.getElementById('syringe-type').value;

        const vial = getVialAmount(type);
        const bac = getBacWater(type);
        const doseId = type + '-dose';
        const dose = parseFloat(document.getElementById(doseId).value) || (type === 'peptide' ? 0.5 : type === 'hgh' ? 2 : 250);

        const conc = vial / bac;
        const drawMl = dose / conc;
        let units = Math.round(drawMl * 100);

        let displayUnits = units;
        let isPen = syringeTypeSelect === 'pen';

        if (isPen) {
            displayUnits = Math.round(drawMl * 100); // Clicks for pen
        } else {
            const factor = parseInt(syringeTypeSelect) / 100;
            displayUnits = Math.round(units * factor);
        }

        const resultPrefix = type;
        document.getElementById(resultPrefix + '-conc').textContent = conc.toFixed(1) + (type === 'peptide' ? ' mg/ml' : ' IU/ml');
        document.getElementById(resultPrefix + '-draw-ml').textContent = drawMl.toFixed(3) + ' ml';
        document.getElementById(resultPrefix + '-units').textContent = displayUnits + (isPen ? ' Klicks' : ' U');

        // Visual
        const percent = Math.min(drawMl * 100, 100);
        const liquid = document.getElementById(resultPrefix + '-liquid');
        if (liquid) liquid.style.height = percent + '%';

        document.getElementById(resultPrefix + '-syringe-label').textContent = drawMl.toFixed(2) + ' ml / ' + displayUnits + (isPen ? ' Klicks' : ' U');

        // mg equivalent
        if (type === 'hgh') {
            document.getElementById('hgh-mg-equiv').textContent = `~${(vial / 3).toFixed(2)} mg`;
        } else if (type === 'hcg') {
            document.getElementById('hcg-mg-equiv').textContent = `~${(vial / 9000).toFixed(3)} mg`;
        }
    }

    // Live update
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', updateCalculations);
        el.addEventListener('change', updateCalculations);
    });

    updateCalculations();
});