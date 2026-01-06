import postalCodes from './huPostalCodes.json';

/**
 * Város keresése irányítószám alapján
 * @param {string|number} zip 
 * @returns {string|null}
 */
export const getCityByZip = (zip) => {
    if (!zip || String(zip).length < 4) return null;
    const match = postalCodes.find(item => String(item.zip) === String(zip));
    return match ? match.city : null;
};

/**
 * Irányítószám keresése város alapján
 * @param {string} city 
 * @returns {string|null}
 */
export const getZipByCity = (city) => {
    if (!city || city.length < 2) return null;

    // Exact match search (case insensitive)
    const normalizedCity = city.trim().toLowerCase();

    // Special case for Budapest - usually returns 1000 or the first one found
    const match = postalCodes.find(item => item.city.toLowerCase() === normalizedCity);

    return match ? String(match.zip) : null;
};

/**
 * Település javaslatok listázása város név töredék alapján
 * @param {string} query 
 * @returns {Array}
 */
export const searchSettlements = (query) => {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase();
    const results = postalCodes
        .filter(item => item.city.toLowerCase().includes(normalizedQuery))
        .map(item => ({ zip: String(item.zip), city: item.city }))
        .slice(0, 10);

    // Remove duplicates (e.g. multiple ZIPs for same city)
    return Array.from(new Set(results.map(r => r.city)))
        .map(city => results.find(r => r.city === city));
};
