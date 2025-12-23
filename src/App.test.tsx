/**
 * Minimal Test App to debug black page issue
 */

import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '50px',
        fontSize: '24px',
        minHeight: '100vh'
      }}>
        <h1>TEST - If you see this, React is working!</h1>
        <p>Background should be RED</p>
        <p>Text should be WHITE</p>
      </div>
    </BrowserRouter>
  );
}

export default App;
