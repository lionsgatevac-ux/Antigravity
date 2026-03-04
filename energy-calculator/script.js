// Building parameters from Table 2.8.6.3
const buildingData = {
    'CSH': {
        name: 'Családi Ház',
        qF: 66,
        qHMV: 27.5,
        kRegi1: 1.11,
        Ck1Regi: 1.01,
        kRegi2: 1.44,
        Ck2Regi: 1.25
    },
    'TH<10': {
        name: 'Társasház <10 lakás',
        qF: 52,
        qHMV: 27.5,
        kRegi1: 1.18,
        Ck1Regi: 1.01,
        kRegi2: 1.52,
        Ck2Regi: 1.20
    },
    'TH>10': {
        name: 'Társasház >10 lakás',
        qF: 39,
        qHMV: 27.5,
        kRegi1: 1.20,
        Ck1Regi: 1.01,
        kRegi2: 1.56,
        Ck2Regi: 1.15
    },
    'IÉ': {
        name: 'Irodaépület',
        qF: 44,
        qHMV: 0,
        kRegi1: 1.42,
        Ck1Regi: 1.01,
        kRegi2: 1.75,
        Ck2Regi: 1.15
    },
    'OÉ': {
        name: 'Oktatási Épület',
        qF: 57,
        qHMV: 0,
        kRegi1: 1.15,
        Ck1Regi: 1.01,
        kRegi2: 1.47,
        Ck2Regi: 1.15
    }
};

// Heat pump SCOP values from Table 2.8.6.3
const heatPumpData = {
    'low-water': {
        name: 'Alacsony Hőmérsékletű Víz-Víz Hőszivattyú',
        invSCOPuj: 0.19,
        SCOPref: 3.13,
        invSCOPref: 0.32
    },
    'medium-water': {
        name: 'Közepes Hőmérsékletű Víz-Víz Hőszivattyú',
        invSCOPuj: 0.28,
        SCOPref: 2.75,
        invSCOPref: 0.36
    },
    'low-air': {
        name: 'Alacsony Hőmérsékletű Levegő-Víz Hőszivattyú',
        invSCOPuj: 0.30,
        SCOPref: 3.13,
        invSCOPref: 0.32
    },
    'air-air': {
        name: 'Levegő-Levegő Hőszivattyú',
        invSCOPuj: 0.30,
        SCOPref: 3.13,
        invSCOPref: 0.32
    },
    'medium-air': {
        name: 'Közepes Hőmérsékletű Levegő-Víz Hőszivattyú',
        invSCOPuj: 0.35,
        SCOPref: 2.75,
        invSCOPref: 0.36
    }
};

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Attic Insulation Calculator
document.getElementById('attic-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const area = parseFloat(document.getElementById('attic-area').value);
    const factor = parseFloat(document.getElementById('attic-type').value);

    // Calculate savings: Q = A × Factor
    const savings = area * factor;
    const savingsKWh = savings * 277.778; // 1 GJ = 277.778 kWh

    // Display results
    document.getElementById('attic-savings').textContent = savings.toFixed(2);
    document.getElementById('attic-kwh').textContent = savingsKWh.toFixed(2);
    document.getElementById('attic-detail-area').textContent = `${area.toFixed(2)} m²`;
    document.getElementById('attic-detail-factor').textContent = factor.toFixed(1);

    // Show results with animation
    const resultsDiv = document.getElementById('attic-results');
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Heat Pump Calculator
document.getElementById('heatpump-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const buildingType = document.getElementById('building-type').value;
    const heatedArea = parseFloat(document.getElementById('heated-area').value);
    const systemType = document.querySelector('input[name="system-type"]:checked').value;
    const oldBoilerType = document.getElementById('old-boiler-type').value;
    const boilerPower = parseFloat(document.getElementById('boiler-power').value);
    const boilerAge = parseFloat(document.getElementById('boiler-age').value);
    const hpType = document.getElementById('hp-type').value;
    const scop = parseFloat(document.getElementById('scop').value);

    // Get building parameters
    const building = buildingData[buildingType];
    const qF = building.qF;
    let qHMV = building.qHMV;

    // If heating only, set qHMV to 0
    if (systemType === 'heating-only') {
        qHMV = 0;
    }

    // Get old system parameters
    let kRegi, CkRegi;
    if (oldBoilerType === 'condensing') {
        kRegi = building.kRegi1;
        CkRegi = building.Ck1Regi;
    } else {
        kRegi = building.kRegi2;
        CkRegi = building.Ck2Regi;
    }

    // Get heat pump parameters
    const heatPump = heatPumpData[hpType];
    const invSCOPuj = 1 / scop;
    const SCOPref = heatPump.SCOPref;
    const invSCOPref = heatPump.invSCOPref;

    // Calculate new system factor
    const kUj = (kRegi / CkRegi) * invSCOPuj;

    // Calculate reference system factor
    const kRef = (kRegi / CkRegi) * invSCOPref;

    // Determine scenario: Early Replacement or End of Life
    let scenario;
    let ageLimit;

    if (boilerPower < 30) {
        ageLimit = 20;
    } else {
        ageLimit = 25;
    }

    let savings;
    if (boilerAge <= ageLimit) {
        // Early Replacement (Korai csere)
        scenario = 'Korai Csere';
        // Formula 2.8.7.1.1: ΔE = A × (qF + qHMV) × (kRegi - kUj) × 0.0036
        savings = heatedArea * (qF + qHMV) * (kRegi - kUj) * 0.0036;
    } else {
        // End of Life (Élettartam végén)
        scenario = 'Élettartam Végén';
        // Formula 2.8.7.2.1: ΔE = A × (qF + qHMV) × (kRef - kUj) × 0.0036
        savings = heatedArea * (qF + qHMV) * (kRef - kUj) * 0.0036;
    }

    const savingsKWh = savings * 277.778; // 1 GJ = 277.778 kWh

    // Display results
    document.getElementById('hp-savings').textContent = savings.toFixed(2);
    document.getElementById('hp-kwh').textContent = savingsKWh.toFixed(2);

    // Display scenario badge
    const scenarioBadge = document.getElementById('scenario-badge');
    scenarioBadge.textContent = scenario;

    // Display calculation details
    document.getElementById('hp-detail-building').textContent = building.name;
    document.getElementById('hp-detail-area').textContent = `${heatedArea.toFixed(2)} m²`;
    document.getElementById('hp-detail-qf').textContent = `${qF.toFixed(2)} kWh/m²·a`;
    document.getElementById('hp-detail-qhmv').textContent = `${qHMV.toFixed(2)} kWh/m²·a`;
    document.getElementById('hp-detail-kregi').textContent = kRegi.toFixed(3);
    document.getElementById('hp-detail-kuj').textContent = kUj.toFixed(3);
    document.getElementById('hp-detail-kref').textContent = kRef.toFixed(3);

    // Show results with animation
    const resultsDiv = document.getElementById('heatpump-results');
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Input validation and formatting
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const min = parseFloat(e.target.min);
        const max = parseFloat(e.target.max);

        if (value < min) {
            e.target.setCustomValidity(`Value must be at least ${min}`);
        } else if (max && value > max) {
            e.target.setCustomValidity(`Value must be at most ${max}`);
        } else {
            e.target.setCustomValidity('');
        }
    });
});

// Auto-fill typical SCOP values when heat pump type changes
document.getElementById('hp-type').addEventListener('change', (e) => {
    const hpType = e.target.value;
    const scopInput = document.getElementById('scop');

    if (hpType && !scopInput.value) {
        const heatPump = heatPumpData[hpType];
        // Suggest a typical value slightly better than reference
        const typicalSCOP = heatPump.SCOPref * 1.3;
        scopInput.placeholder = `e.g., ${typicalSCOP.toFixed(1)} (typical)`;
    }
});

// Smooth scroll for form submission
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
        setTimeout(() => {
            const resultsSection = form.nextElementSibling;
            if (resultsSection && resultsSection.classList.contains('results')) {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    });
});

// Split Climate Calculator
document.getElementById('split-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const power = parseFloat(document.getElementById('split-power').value);
    const seer = parseFloat(document.getElementById('split-seer').value);
    const hours = 350; // Annual cooling hours EKR 2.10

    // Determine Reference SEER based on power
    // <= 6 kW: 4.6
    // 6-12 kW: 4.3
    let refSeer;
    if (power <= 6) {
        refSeer = 4.6;
    } else {
        refSeer = 4.3;
    }

    // Formula: P * hours * (1/SEER_ref - 1/SEER_new) * 0.0036 (to GJ)
    // 1 kWh = 0.0036 GJ
    const savings = power * hours * ((1 / refSeer) - (1 / seer)) * 0.0036;
    const savingsKWh = savings * 277.778;

    // Validation: SEER_new must be better than SEER_ref for savings
    if (savings <= 0) {
        alert(`Az új berendezés SEER értékének nagyobbnak kell lennie, mint a referencia érték (${refSeer}) a megtakarításhoz.`);
        return;
    }

    // Display results
    document.getElementById('split-savings').textContent = savings.toFixed(2);
    document.getElementById('split-kwh').textContent = savingsKWh.toFixed(2);

    document.getElementById('split-detail-power').textContent = `${power.toFixed(1)} kW`;
    document.getElementById('split-detail-ref-seer').textContent = refSeer.toFixed(2);
    document.getElementById('split-detail-new-seer').textContent = seer.toFixed(2);

    // Show results with animation
    const resultsDiv = document.getElementById('split-results');
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
