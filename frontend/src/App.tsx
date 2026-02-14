import { ToastProvider } from './components';
import { ShipmentsScreen } from './screens/shipments';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <div className="app">
        <header className="header">
          <div className="container">
            <h1 className="logo">FastTrack</h1>
            <p className="tagline">Shipment Management System</p>
          </div>
        </header>
        <main className="main">
          <div className="container">
            <ShipmentsScreen />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
