// Calculate net area
function calculateNetArea(grossArea, chimneyArea = 0, atticDoorArea = 0, otherDeductedArea = 0) {
    return Math.max(0, grossArea - chimneyArea - atticDoorArea - otherDeductedArea);
}

// Calculate energy saving in GJ
function calculateEnergySaving(netArea) {
    return netArea * 0.461; // GJ per m2 (EKR katalógus szerint)
}

// Calculate contractor fee based on energy saving
function calculateContractorFee(energySavingGJ) {
    return energySavingGJ * 11705; // Ft per GJ
}

// Calculate VAT
function calculateVAT(netAmount, vatRate = 0.27) {
    return netAmount * vatRate;
}

// Calculate gross amount
function calculateGrossAmount(netAmount, vat) {
    return netAmount + vat;
}

// Convert number to Hungarian words
function numberToWords(num) {
    if (num === 0) return 'nulla';

    const ones = ['', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
    const tens = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
    const teens = ['tíz', 'tizenegy', 'tizenkettő', 'tizenhárom', 'tizennégy', 'tizenöt', 'tizenhat', 'tizenhét', 'tizennyolc', 'tizenkilenc'];

    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    if (num >= 20 && num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return tens[ten] + (one > 0 ? ones[one] : '');
    }

    // For larger numbers, simplified version
    if (num >= 100 && num < 1000) {
        const hundred = Math.floor(num / 100);
        const rest = num % 100;
        return (hundred > 1 ? ones[hundred] : '') + 'száz' + (rest > 0 ? numberToWords(rest) : '');
    }

    if (num >= 1000 && num < 1000000) {
        const thousand = Math.floor(num / 1000);
        const rest = num % 1000;
        return (thousand > 1 ? numberToWords(thousand) : '') + 'ezer' + (rest > 0 ? numberToWords(rest) : '');
    }

    if (num >= 1000000) {
        const million = Math.floor(num / 1000000);
        const rest = num % 1000000;
        return numberToWords(million) + 'millió' + (rest > 0 ? numberToWords(rest) : '');
    }

    return num.toString();
}

// Format amount to words
function amountToWords(amount) {
    return numberToWords(Math.floor(amount)) + ' forint';
}

module.exports = {
    calculateNetArea,
    calculateEnergySaving,
    calculateContractorFee,
    calculateVAT,
    calculateGrossAmount,
    numberToWords,
    amountToWords
};
