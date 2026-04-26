require('dotenv').config();

const { getStoragePaths, initializeStore } = require('../articleStore');

async function main() {
  await initializeStore();
  const paths = getStoragePaths();
  console.log(`Article storage is ready at ${paths.storageRoot}`);
}

main().catch((error) => {
  console.error('Failed to initialize article storage:', error.message);
  process.exit(1);
});
