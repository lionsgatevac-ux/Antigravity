// Validate required field
export const required = (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return 'Ez a mező kötelező';
    }
    return null;
};

// Validate email
export const email = (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Érvénytelen email cím';
    }
    return null;
};

// Validate phone number
export const phone = (value) => {
    if (!value) return null;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value)) {
        return 'Érvénytelen telefonszám';
    }
    return null;
};

// Validate number
export const number = (value) => {
    if (!value) return null;
    if (isNaN(value)) {
        return 'Csak számokat adhat meg';
    }
    return null;
};

// Validate positive number
export const positiveNumber = (value) => {
    const numError = number(value);
    if (numError) return numError;
    if (parseFloat(value) < 0) {
        return 'A szám nem lehet negatív';
    }
    return null;
};

// Validate postal code
export const postalCode = (value) => {
    if (!value) return null;
    const postalRegex = /^\d{4}$/;
    if (!postalRegex.test(value)) {
        return 'Érvénytelen irányítószám (4 számjegy)';
    }
    return null;
};

// Validate form
export const validateForm = (values, rules) => {
    const errors = {};

    for (const field in rules) {
        const validators = Array.isArray(rules[field]) ? rules[field] : [rules[field]];

        for (const validator of validators) {
            const error = validator(values[field]);
            if (error) {
                errors[field] = error;
                break;
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
