// Calculate net area
export const calculateNetArea = (grossArea, chimneyArea = 0, atticDoorArea = 0, otherDeductedArea = 0) => {
    const net = parseFloat(grossArea) - parseFloat(chimneyArea) - parseFloat(atticDoorArea) - parseFloat(otherDeductedArea);
    return Math.max(0, net).toFixed(2);
};

// Calculate energy saving in GJ
export const calculateEnergySaving = (netArea) => {
    return (parseFloat(netArea) * 0.461).toFixed(2);
};

// Calculate contractor fee based on energy saving
export const calculateContractorFee = (energySavingGJ) => {
    return Math.round(parseFloat(energySavingGJ) * 11705);
};

// Calculate VAT
export const calculateVAT = (netAmount, vatRate = 0.27) => {
    return Math.round(parseFloat(netAmount) * vatRate);
};

// Calculate gross amount
export const calculateGrossAmount = (netAmount, vat) => {
    return parseFloat(netAmount) + parseFloat(vat);
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
