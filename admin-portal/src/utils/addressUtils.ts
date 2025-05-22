/**
 * Address validation and formatting utilities
 */

export interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  fullAddress: string;
}

/**
 * Parse a full address string and extract components
 */
export const parseAddress = (address: string): AddressComponents => {
  const parts = address.split(',').map(part => part.trim());
  
  return {
    fullAddress: address,
    // Basic parsing - in a real app you might use a more sophisticated parser
    street: parts[0] || '',
    city: parts[1] || '',
    state: parts[2] || '',
    country: parts[parts.length - 1] || ''
  };
};

/**
 * Validate if an address has the minimum required components
 */
export const isValidAddress = (address: string): boolean => {
  if (!address || address.trim().length < 10) {
    return false;
  }

  // Check for basic address components
  const hasStreetIndicators = /\d+/.test(address); // Has numbers (street number)
  const hasCommas = address.includes(','); // Has comma separators
  
  return hasStreetIndicators && hasCommas;
};

/**
 * Format address for display
 */
export const formatAddressForDisplay = (address: string): string => {
  return address.replace(/,\s*,/g, ',').trim();
};

/**
 * Get address validation message
 */
export const getAddressValidationMessage = (address: string): string | null => {
  if (!address.trim()) {
    return 'Address is required';
  }
  
  if (address.trim().length < 10) {
    return 'Address seems too short. Please enter a complete address.';
  }
  
  if (!isValidAddress(address)) {
    return 'Please enter a complete address with street, city, and country.';
  }
  
  return null;
};

/**
 * Suggest address improvements
 */
export const getAddressSuggestion = (address: string): string | null => {
  if (!address.includes(',')) {
    return 'Try adding commas to separate street, city, state/province, and country.';
  }
  
  if (!/\d+/.test(address)) {
    return 'Make sure to include the street number.';
  }
  
  return null;
};