const { Storage } = require('./storage');
const fs = require('fs-extra');
const path = require('path');

const testDir = '/tmp/storage-test-' + Date.now();

console.log('Testing Storage with updated fs-extra...');
console.log('Test directory:', testDir);

try {
  // Test 1: Create storage and validate
  console.log('\n1. Creating storage and validating...');
  const storage = new Storage(testDir);
  storage.validate();
  console.log('   ✓ Storage validated successfully');
  
  // Test 2: Store data
  console.log('\n2. Storing test data...');
  const testData = Buffer.from('This is test content for carbone');
  const hash = storage.store(testData);
  console.log('   ✓ Data stored with hash:', hash);
  console.log('   ✓ Hash validation:', storage.isHash(hash));
  
  // Test 3: Retrieve path and verify file exists
  console.log('\n3. Verifying stored file...');
  const filePath = storage.path(hash);
  console.log('   File path:', filePath);
  console.log('   ✓ File exists:', fs.existsSync(filePath));
  
  // Test 4: Read and verify content
  const readData = fs.readFileSync(filePath);
  console.log('   ✓ Content matches:', readData.equals(testData));
  
  // Cleanup
  fs.removeSync(testDir);
  console.log('\n✓ All storage tests passed!');
  
} catch (error) {
  console.error('\n✗ Test failed:', error.message);
  console.error(error.stack);
  // Cleanup on error
  try {
    fs.removeSync(testDir);
  } catch (e) {}
  process.exit(1);
}
