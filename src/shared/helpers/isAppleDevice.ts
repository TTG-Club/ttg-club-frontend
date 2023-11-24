import UAParser from 'ua-parser-js';

const parser = new UAParser();
const { vendor } = parser.getDevice();
const isAppleDevice = /apple/gi.test(vendor || '');

export default isAppleDevice;
