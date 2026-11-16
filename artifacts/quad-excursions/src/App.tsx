import { useEffect } from 'react';
import { enhance } from './enhance';

function App() {
  useEffect(() => {
    const cleanup = enhance();
    return cleanup;
  }, []);
  return null;
}

export default App;
