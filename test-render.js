const carbone = require('carbone');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

const render = util.promisify(carbone.render);

console.log('Testing Carbone render with v' + require('carbone/package.json').version);

async function test() {
  try {
    // Create a simple template
    const templatePath = '/tmp/test-template.txt';
    fs.writeFileSync(templatePath, 'Hello {d.name}, your total is {d.total}!');
    
    console.log('\n1. Testing basic render...');
    const data = { name: 'World', total: 42 };
    const result = await render(templatePath, data);
    console.log('   Result:', result.toString());
    console.log('   ✓ Basic render works');
    
    // Test with custom formatters
    console.log('\n2. Testing with custom formatters...');
    
    // Mark default formatters
    for (const name in carbone.formatters) {
      carbone.formatters[name].$isDefault = true;
    }
    
    // Save defaults
    const defaultFormatters = {};
    for (const name in carbone.formatters) {
      if (carbone.formatters[name].$isDefault) {
        defaultFormatters[name] = carbone.formatters[name];
      }
    }
    
    // Reset formatters
    carbone.formatters = defaultFormatters;
    
    // Add custom formatter
    carbone.addFormatters({
      upper: function(d) {
        return d.toString().toUpperCase();
      }
    });
    
    console.log('   Custom formatter added');
    
    // Create template using custom formatter
    const templatePath2 = '/tmp/test-template2.txt';
    fs.writeFileSync(templatePath2, 'HELLO {d.name:upper()}!');
    
    const result2 = await render(templatePath2, { name: 'world' });
    console.log('   Result:', result2.toString());
    console.log('   ✓ Custom formatter works');
    
    // Cleanup
    fs.removeSync(templatePath);
    fs.removeSync(templatePath2);
    
    console.log('\n✓ All render tests passed!');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
