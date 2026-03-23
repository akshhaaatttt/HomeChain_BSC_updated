// Quick test to verify Anvil and MetaMask connection
const Web3 = require('web3');

async function testConnection() {
  console.log('Testing blockchain connection...\n');

  try {
    // Test direct RPC connection to Anvil
    const web3Direct = new Web3('http://127.0.0.1:8545');
    const blockNumber = await web3Direct.eth.getBlockNumber();
    console.log('✅ Direct Anvil connection works');
    console.log('   Current block number:', blockNumber);
  } catch (err) {
    console.log('❌ Direct Anvil connection failed:', err.message);
  }

  try {
    // Test ngrok tunnel
    const web3Ngrok = new Web3('https://racheal-uninvoked-jeneva.ngrok-free.dev');
    const blockNumber = await web3Ngrok.eth.getBlockNumber();
    console.log('✅ Ngrok tunnel connection works');
    console.log('   Current block number:', blockNumber);
  } catch (err) {
    console.log('❌ Ngrok tunnel connection failed:', err.message);
  }

  try {
    // Test MetaMask provider (simulated)
    const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const web3Direct = new Web3('http://127.0.0.1:8545');
    const contract = new web3Direct.eth.Contract(
      [
        {
          inputs: [],
          name: 'roomCount',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        }
      ],
      CONTRACT_ADDRESS
    );
    
    const roomCount = await contract.methods.roomCount().call();
    console.log('✅ Contract connection works');
    console.log('   Room count:', roomCount.toString());
  } catch (err) {
    console.log('❌ Contract connection failed:', err.message);
  }
}

testConnection().catch(console.error);
