import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, deleteUser } from 'aws-amplify/auth';
import { MovieCard } from '../components/MovieCard';

const client = generateClient();

export function Dashboard({ signOut, user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    surname: '',
    age: '',
    bio: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch movie activity
    const sub = client.models.MovieActivity.observeQuery({
      filter: { userId: { eq: user.userId } }
    }).subscribe({
      next: ({ items }) => {
        setActivities(items);
        setLoading(false);
      },
      error: (err) => console.error(err)
    });

    // Fetch or create profile
    async function initProfile() {
      try {
        const { data: existingProfile } = await client.models.UserProfile.get({
          userId: user.userId
        });

        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          // Try to get name from Cognito attributes
          const attributes = await fetchUserAttributes();
          const newProfile = {
            userId: user.userId,
            username: user.username,
            name: attributes.name || '',
            surname: '',
            age: null,
            bio: '',
          };
          const { data: createdProfile } = await client.models.UserProfile.create(newProfile);
          setProfile(createdProfile);
        }
      } catch (err) {
        console.error("Error fetching/creating profile:", err);
      }
    }

    initProfile();
    return () => sub.unsubscribe();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile = {
        userId: user.userId,
        name: profile.name,
        surname: profile.surname,
        age: profile.age ? parseInt(profile.age) : null,
        bio: profile.bio,
      };
      await client.models.UserProfile.update(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      "WARNING: This will permanently delete your account and all your data (movie logs, profile, and connections). This action cannot be undone. Are you sure?"
    );
    if (!confirmed) return;

    const secondConfirm = window.prompt("To confirm deletion, please type 'DELETE' below:");
    if (secondConfirm !== 'DELETE') {
      alert("Account deletion cancelled.");
      return;
    }

    setSaving(true);
    try {
      // 1. Delete Movie Activities
      const { data: activitiesToDelete } = await client.models.MovieActivity.list({
        filter: { userId: { eq: user.userId } }
      });
      await Promise.all(activitiesToDelete.map(act => client.models.MovieActivity.delete({ id: act.id })));

      // 2. Delete Connections (Follower)
      const { data: connectionsAsFollower } = await client.models.Connection.list({
        filter: { followerId: { eq: user.userId } }
      });
      await Promise.all(connectionsAsFollower.map(conn => client.models.Connection.delete({ id: conn.id })));

      // 3. Delete Connections (Following)
      const { data: connectionsAsFollowing } = await client.models.Connection.list({
        filter: { followingId: { eq: user.userId } }
      });
      await Promise.all(connectionsAsFollowing.map(conn => client.models.Connection.delete({ id: conn.id })));

      // 4. Delete Profile
      await client.models.UserProfile.delete({ userId: user.userId });

      // 5. Delete Cognito User
      await deleteUser();
      
      alert("Your account and data have been successfully deleted.");
      window.location.href = "/";
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("An error occurred while deleting your account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
              Hello, {profile.name || user?.username || 'User'}!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Logged in as <span style={{ color: 'var(--accent-color)' }}>{user?.username}</span>
            </p>
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px', display: 'inline-block' }}>
              <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User ID: {user?.userId}</code>
            </div>
          </div>
          <button onClick={signOut} className="btn-danger">Sign Out</button>
        </div>
      </div>

      <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Profile Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <section className="glass-panel profile-section" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Your Profile</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ padding: '5px 15px', fontSize: '0.9rem' }}>Edit</button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    value={profile.name || ''} 
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Surname</label>
                  <input 
                    type="text" 
                    value={profile.surname || ''} 
                    onChange={(e) => setProfile({...profile, surname: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    value={profile.age || ''} 
                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={profile.bio || ''} 
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="form-input"
                    style={{ minHeight: '80px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: '500' }}>{profile.name} {profile.surname || ''}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Age</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: '500' }}>{profile.age || 'Not set'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bio</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.95rem', lineHeight: '1.4' }}>{profile.bio || 'Tell us about your movie taste...'}</p>
                </div>
              </div>
            )}
          </section>

          {/* Danger Zone */}
          <section className="glass-panel" style={{ padding: '25px', borderColor: 'rgba(255, 71, 71, 0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: 'var(--danger-color)' }}>Danger Zone</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              onClick={handleAccountDeletion} 
              className="btn-danger" 
              style={{ width: '100%', padding: '10px' }}
              disabled={saving}
            >
              {saving ? 'Processing...' : 'Delete My Account'}
            </button>
          </section>
        </div>

        {/* Activity Section */}
        <section>
          <h3 className="section-title" style={{ marginTop: 0 }}>Your Recent Activity</h3>
          
          {loading ? (
            <div className="loading-spinner">Loading your movies...</div>
          ) : (
            <div className="movie-grid">
              {activities.length > 0 ? (
                activities.map(act => (
                  <div key={act.id} style={{ position: 'relative' }}>
                    <MovieCard movie={{ id: act.movieId, title: act.movieTitle, poster_path: act.posterPath }} />
                    <div style={{ marginTop: '10px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Rating: {act.rating} / 10</span>
                      {act.review && <p style={{ fontSize: '0.85rem', marginTop: '5px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{act.review}"</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You haven't logged any movies yet. Go to a movie's detail page to log it!</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
