import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { Link } from 'react-router-dom';

const client = generateClient();

export function FollowingList() {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const user = await getCurrentUser();
        
        // Subscribe to connections
        const sub = client.models.Connection.observeQuery({
          filter: { followerId: { eq: user.userId } }
        }).subscribe({
          next: async ({ items }) => {
            // For each connection, fetch the profile to get the name
            const followingWithProfiles = await Promise.all(items.map(async (conn) => {
              const { data: profile } = await client.models.UserProfile.get({
                userId: conn.followingId
              });
              return {
                ...conn,
                displayName: profile ? `${profile.name} ${profile.surname || ''}`.trim() : conn.followingUsername
              };
            }));
            setFollowing(followingWithProfiles);
            setLoading(false);
          },
          error: (err) => console.error(err)
        });
        return () => sub.unsubscribe();
      } catch (err) {
        console.error("User not signed in", err);
      }
    }
    fetchFollowing();
  }, []);

  const handleUnfollow = async (connectionId, friendName) => {
    if (!window.confirm(`Are you sure you want to unfollow ${friendName}?`)) return;
    
    try {
      await client.models.Connection.delete({ id: connectionId });
      alert(`Unfollowed ${friendName}`);
      // The observer will update the list automatically
    } catch (err) {
      console.error("Error unfollowing:", err);
      alert("Failed to unfollow.");
    }
  };

  return (
    <div className="following-page">
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <h2>Friends You Follow</h2>
        <p style={{ color: 'var(--text-secondary)' }}>See what your friends are watching and their ratings.</p>
      </div>

      <div className="content-section">
        {loading ? (
          <p>Loading your friends list...</p>
        ) : following.length > 0 ? (
          <div className="friends-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {following.map(conn => (
              <div key={conn.id} style={{ position: 'relative' }}>
                <Link to={`/user/${conn.followingId}?username=${conn.followingUsername}`} className="friend-card-link">
                  <div className="glass-panel friend-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', transition: 'transform 0.2s' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--accent-color)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '1.8rem', 
                      color: '#000',
                      fontWeight: 'bold'
                    }}>
                      {conn.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{conn.displayName}</h3>
                      <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{conn.followingUsername}</p>
                      <p style={{ margin: '8px 0 0 0', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: '500' }}>View Profile →</p>
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnfollow(conn.id, conn.displayName);
                  }}
                  className="btn-danger"
                  style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    padding: '5px 10px', 
                    fontSize: '0.8rem',
                    zIndex: 2
                  }}
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You aren't following anyone yet. Head over to the Friends Feed to find people!</p>
          </div>
        )}
      </div>
    </div>
  );
}
