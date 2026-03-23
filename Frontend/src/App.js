import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [devices, setDevices] = useState([]);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    loadWeb3Account();
  }, []);

  const loadWeb3Account = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Failed to load account:', error);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>HomeChain</h1>
        <p>Smart Home Automation on BSC</p>
        {account && <p>Connected: {account}</p>}
      </header>
      <main className="App-main">
        <div className="devices-container">
          <h2>Smart Devices</h2>
          {devices.length === 0 ? (
            <p>No devices connected yet</p>
          ) : (
            <ul>
              {devices.map((device, index) => (
                <li key={index}>{device.name}</li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
