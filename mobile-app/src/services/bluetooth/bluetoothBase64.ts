/**
 * Simple Base64 implementation for React Native
 * This is a fallback implementation if react-native-base64 is not available
 */

// Base64 encoding table
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/**
 * Encode a string to base64
 * @param input String to encode
 * @returns Base64 encoded string
 */
export const encode = (input: string): string => {
  let output = '';
  let i = 0;
  
  while (i < input.length) {
    const chr1 = input.charCodeAt(i++);
    const chr2 = i < input.length ? input.charCodeAt(i++) : NaN;
    const chr3 = i < input.length ? input.charCodeAt(i++) : NaN;
    
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = isNaN(chr3) ? 64 : chr3 & 63;
    
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  
  return output;
};

/**
 * Decode a base64 string
 * @param input Base64 encoded string
 * @returns Decoded string
 */
export const decode = (input: string): string => {
  let output = '';
  let i = 0;
  
  // Remove any characters that are not in the base64 alphabet
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  
  while (i < input.length) {
    const enc1 = chars.indexOf(input.charAt(i++));
    const enc2 = chars.indexOf(input.charAt(i++));
    const enc3 = chars.indexOf(input.charAt(i++));
    const enc4 = chars.indexOf(input.charAt(i++));
    
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    
    output += String.fromCharCode(chr1);
    
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }
  
  return output;
};

export default { encode, decode };
