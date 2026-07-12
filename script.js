document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
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
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
            
            updateCalculations();
        });
    });

    // Setup option buttons for all tabs
    setupOptionButtons('peptide');
    setupOptionButtons('hgh');
    setupOptionButtons('hcg');
    
    // Inputs
    const peptideDose = document.getElementById('peptide-dose');
    const peptideSlider = document.getElementById('peptide-dose-slider');
    const hghDose = document.getElementById('hgh-dose');
    const hghSlider = document.getElementById('hgh-dose-slider');
    const syringeType = document.getElementById('syringe-type');

    // Sync number and slider
    function syncInputs(numId, sliderId) {
        const num = document.getElementById(numId);
        const slider = document.getElementById(sliderId);
        
        num.addEventListener('input', () => {
            slider.value = num.value;
            updateCalculations();
        });
        
        slider.addEventListener('input', () => {
            num.value = slider.value;
            updateCalculations();
        });
    }

    syncInputs('peptide-dose', 'peptide-dose-slider');
    syncInputs('hgh-dose', 'hgh-dose-slider');
    syncInputs('hcg-dose', 'hcg-dose-slider');

    syringeType.addEventListener('change', updateCalculations);

    // Custom inputs visibility
    function setupCustomInputs() {
        const customBtns = document.querySelectorAll('.custom-btn');
        customBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopImmediatePropagation(); // Prevent any bubbling issues
                
                // Find the correct custom input for this group
                const inputGroup = btn.closest('.input-group');
                const customInput = inputGroup.querySelector('.custom-input');
                
                if (customInput) {
                    customInput.style.display = 'block';
                    customInput.focus();
                }
            });
        });
    }
    setupCustomInputs();

    // Option buttons
    function setupOptionButtons(type) {
        const buttons = document.querySelectorAll(`#${type}-tab .option-btn`);
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                
                // Only affect buttons in the same options group
                const optionsGroup = btn.closest('.options');
                const groupButtons = optionsGroup.querySelectorAll('.option-btn');
                
                groupButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Handle custom input
                const inputGroup = btn.closest('.input-group');
                const customInput = inputGroup.querySelector('.custom-input');
                
                if (customInput) {
                    if (btn.dataset.value === 'custom') {
                        customInput.style.display = 'block';
                        customInput.focus();
                    } else {
                        customInput.style.display = 'none';
                    }
                }
                
                updateCalculations();
            });
        });
    }

    function getVialAmount(type) {
        let selector, customId, defaultVal = 10;
        
        if (type === 'peptide') {
            selector = '#peptide-tab .option-btn.active';
            customId = 'peptide-custom-mg';
        } else if (type === 'hgh') {
            selector = '#hgh-tab .option-btn.active';
            customId = 'hgh-custom-iu';
        } else if (type === 'hcg') {
            selector = '#hcg-tab .option-btn.active';
            customId = 'hcg-custom-iu';
            defaultVal = 5000;
        }
        
        const activeBtn = document.querySelector(selector);
        if (!activeBtn) return defaultVal;
        
        if (activeBtn.dataset.value === 'custom') {
            return parseFloat(document.getElementById(customId).value) || defaultVal;
        }
        return parseFloat(activeBtn.dataset.value) || defaultVal;
    }

    function getBacWater(type) {
        // Find the second .options group (Bac Water) in the active tab
        const tab = document.getElementById(type + '-tab');
        if (!tab) return 1;
        
        const optionsGroups = tab.querySelectorAll('.options');
        const bacOptions = optionsGroups[1]; // Second options group is Bac Water
        
        if (!bacOptions) return 1;
        
        const activeBtn = bacOptions.querySelector('.option-btn.active');
        if (!activeBtn) return 1;
        
        if (activeBtn.dataset.value === 'custom') {
            const custom = document.getElementById(type + '-custom-ml');
            return parseFloat(custom ? custom.value : 1) || 1;
        }
        return parseFloat(activeBtn.dataset.value) || 1;
    }

    function updateCalculations() {
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;
        
        const tabId = activeTab.id;
        const type = tabId.replace('-tab', '');
        const syringeFactor = parseInt(syringeType.value) / 100;

        const vialAmount = getVialAmount(type);
        const bacMl = getBacWater(type);
        
        let dose, concUnit, doseUnit, resultPrefix;
        
        if (type === 'peptide') {
            dose = parseFloat(document.getElementById('peptide-dose').value) || 0.5;
            concUnit = 'mg/ml';
            doseUnit = 'mg';
            resultPrefix = 'peptide';
        } else {
            // HGH or HCG (both IU based)
            dose = parseFloat(document.getElementById(type + '-dose').value) || (type === 'hgh' ? 2 : 250);
            concUnit = 'IU/ml';
            doseUnit = 'IU';
            resultPrefix = type;
        }
        
        const concentration = vialAmount / bacMl;
        const drawMl = dose / concentration;
        const units = Math.round(drawMl * 100);
        const adjustedUnits = Math.round(units * syringeFactor);
        
        // Update results
        document.getElementById(resultPrefix + '-conc').textContent = concentration.toFixed(1) + ' ' + concUnit;
        document.getElementById(resultPrefix + '-draw-ml').textContent = drawMl.toFixed(3) + ' ml';
        document.getElementById(resultPrefix + '-units').textContent = adjustedUnits + ' U';
        
        // Syringe visual
        const percent = Math.min((drawMl / 1) * 100, 100);
        document.getElementById(resultPrefix + '-liquid').style.height = percent + '%';
        document.getElementById(resultPrefix + '-syringe-label').textContent = 
            drawMl.toFixed(2) + ' ml / ' + adjustedUnits + ' U';
        
        // HGH & HCG mg equivalent
        if (type === 'hgh') {
            const mg = (vialAmount / 3).toFixed(2);
            document.getElementById('hgh-mg-equiv').textContent = `~${mg} mg`;
        } else if (type === 'hcg') {
            // Typical: 5000 IU vial ≈ 5 mg
            const mg = (vialAmount / 1000).toFixed(2);
            document.getElementById('hcg-mg-equiv').textContent = `~${mg} mg`;
        }
    }

    // Live updates
    const allInputs = document.querySelectorAll('input, select, button');
    allInputs.forEach(input => {
        input.addEventListener('input', updateCalculations);
        input.addEventListener('change', updateCalculations);
    });

    // Initial calculation
    updateCalculations();

    // Keyboard support for mobile
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            updateCalculations();
        }
    });
});