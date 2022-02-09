import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';

import { TextDecoder, TextEncoder } from 'util';

/**
 * Polyfill for encoding which isn't present globally in jsdom
 * Related issue: https://github.com/facebook/jest/issues/9983
 */
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
