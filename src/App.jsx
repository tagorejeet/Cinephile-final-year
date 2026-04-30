import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { Home } from './pages/Home';
import { MovieDetails } from './pages/MovieDetails';
import { Dashboard } from './pages/Dashboard';
import { FriendsFeed } from './pages/FriendsFeed';
import { FollowingList } from './pages/FollowingList';
import { FriendProfile } from './pages/FriendProfile';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--accent-color)', margin: 0, fontSize: '1.5rem' }}>Cinephile</h1>
          <nav style={{ display: 'flex', gap: '15px' }}>
            <a href="/">Home</a>
            <a href="/feed">Friends Feed</a>
            <a href="/following">Following</a>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </header>

        <main className="container" style={{ marginTop: '40px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/feed" element={
              <Authenticator formFields={formFields}>
                {({ user }) => <FriendsFeed user={user} />}
              </Authenticator>
            } />
            <Route path="/following" element={
              <Authenticator formFields={formFields}>
                {() => <FollowingList />}
              </Authenticator>
            } />
            <Route path="/user/:userId" element={
              <Authenticator formFields={formFields}>
                {() => <FriendProfile />}
              </Authenticator>
            } />
            <Route path="/dashboard" element={
              <Authenticator formFields={formFields}>
                {({ signOut, user }) => (
                  <Dashboard signOut={signOut} user={user} />
                )}
              </Authenticator>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const formFields = {
  signUp: {
    name: {
      order: 1,
      placeholder: 'Enter your full name',
      label: 'Name',
      isRequired: true,
    },
    username: {
      order: 2,
    },
    email: {
      order: 3,
    },
    password: {
      order: 4,
    },
    confirm_password: {
      order: 5,
    },
  },
};

export default App;
