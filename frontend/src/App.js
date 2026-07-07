import { useState } from 'react';
import BackgroundVideo from './components/BackgroundVideo';
import LoginForm from './components/LoginForm';
import MainInterface from './components/MainInterface';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  return (
    <>
      <BackgroundVideo />
      {!loggedInUser ? (
        <LoginForm onLoginSuccess={(name) => setLoggedInUser(name)} />
      ) : (
        <MainInterface
          username={loggedInUser}
          onLogout={() => setLoggedInUser(null)}
        />
      )}
    </>
  );
}

export default App;
