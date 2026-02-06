// Helper to safely parse numbers
const safeParseFloat = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    // Handle number type directly
    if (typeof value === 'number') return value;
    // Handle string inputs, replacing comma with dot
    const strVal = String(value).replace(',', '.');
    const parsed = parseFloat(strVal);
    return isNaN(parsed) ? 0 : parsed;
};

// Calculate net area
export const calculateNetArea = (grossArea, chimneyArea = 0, atticDoorArea = 0, otherDeductedArea = 0) => {
    const net = safeParseFloat(grossArea) - safeParseFloat(chimneyArea) - safeParseFloat(atticDoorArea) - safeParseFloat(otherDeductedArea);
    return Math.max(0, net).toFixed(2);
};

// Calculate energy saving in GJ
export const calculateEnergySaving = (netArea) => {
    return (safeParseFloat(netArea) * 0.461).toFixed(2);
};

// Calculate contractor fee based on energy saving
export const calculateContractorFee = (energySavingGJ) => {
    return Math.round(safeParseFloat(energySavingGJ) * 12392);
};

// Calculate VAT
export const calculateVAT = (netAmount, vatRate = 0.27) => {
    return Math.round(safeParseFloat(netAmount) * vatRate);
};

// Calculate gross amount
export const calculateGrossAmount = (netAmount, vat) => {
    return safeParseFloat(netAmount) + safeParseFloat(vat);
};

// Format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('hu-HU').format(amount) + ' Ft';
};

// Format date to Hungarian format
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.`;
};

// Format address
export const formatAddress = (address) => {
    if (!address) return '';
    const { postalCode, city, street, houseNumber } = address;
    return `${postalCode || ''} ${city || ''}, ${street || ''} ${houseNumber || ''}`.trim();
};
