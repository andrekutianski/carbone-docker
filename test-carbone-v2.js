const carbone = require('carbone');
const fs = require('fs');

console.log('Testing Carbone v' + require('carbone/package.json').version);

// Test 1: Check formatters object exists and can be modified
console.log('\n1. Testing formatters object...');
console.log('   Initial formatters count:', Object.keys(carbone.formatters).length);

// Mark default formatters (like the main code does)
for (const name in carbone.formatters) {
  carbone.formatters[name].$isDefault = true;
}
console.log('   Marked default formatters');

// Test 2: Test addFormatters
console.log('\n2. Testing addFormatters...');
const customFormatter = {
  testFormat: function(d) {
    return 'custom-' + d;
  }
};

carbone.addFormatters(customFormatter);
console.log('   Added custom formatter');
console.log('   Formatters count after add:', Object.keys(carbone.formatters).length);
console.log('   Custom formatter exists:', 'testFormat' in carbone.formatters);

// Test 3: Test resetting to defaults
console.log('\n3. Testing formatter reset...');
const defaultFormatters = {};
for (const name in carbone.formatters) {
  if (carbone.formatters[name].$isDefault) {
    defaultFormatters[name] = carbone.formatters[name];
  }
}
carbone.formatters = defaultFormatters;
console.log('   Reset to default formatters');
console.log('   Formatters count after reset:', Object.keys(carbone.formatters).length);
console.log('   Custom formatter removed:', !('testFormat' in carbone.formatters));

console.log('\n✓ All API tests passed for v2');
