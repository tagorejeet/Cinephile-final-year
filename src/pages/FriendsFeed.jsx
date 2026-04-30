import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { MovieCard } from '../components/MovieCard';

const client = generateClient();

export function FriendsFeed() {
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [friendProfiles, setFriendProfiles] = useState({});

  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        // Listen to connections
        const subConnections = client.models.Connection.observeQuery({
          filter: { followerId: { eq: user.userId } }
        }).subscribe({
          next: async ({ items }) => {
            setFollowing(items);
            
            const followingIds = items.map(i => i.followingId);
            if (followingIds.length > 0) {
              // Fetch profiles for followed users to show names
              const profiles = await Promise.all(followingIds.map(async (id) => {
                const { data: p } = await client.models.UserProfile.get({
                  userId: id
                });
                return p;
              }));
              
              const profileMap = {};
              profiles.forEach(p => {
                if (p) profileMap[p.userId] = `${p.name} ${p.surname || ''}`.trim();
              });
              setFriendProfiles(profileMap);

              // Listen to activities from followed users
              const subActivities = client.models.MovieActivity.observeQuery().subscribe({
                next: ({ items: acts }) => {
                  const friendsActs = acts.filter(a => followingIds.includes(a.userId));
                  const sorted = friendsActs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                  setActivities(sorted);
                }
              });
              setLoading(false);
              return () => subActivities.unsubscribe();
            } else {
              setActivities([]);
              setLoading(false);
            }
          }
        });

        return () => subConnections.unsubscribe();
      } catch (err) {
        console.log("User not signed in", err);
      }
    }
    init();
  }, []);

  const handleSearchFriend = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // First, try searching by User ID directly (exact match)
      const { data: profileById } = await client.models.UserProfile.get({
        userId: searchQuery
      });

      if (profileById) {
        setSearchResults([{
          id: profileById.userId,
          username: profileById.username,
          displayName: `${profileById.name} ${profileById.surname || ''}`.trim()
        }]);
      } else {
        // Fallback: search by username in activities
        const { data: userActivities } = await client.models.MovieActivity.list({
          filter: { username: { eq: searchQuery } }
        });

        if (userActivities.length > 0) {
          const foundUser = {
            id: userActivities[0].userId,
            username: userActivities[0].username,
            displayName: userActivities[0].username
          };
          setSearchResults([foundUser]);
        } else {
          setSearchResults([]);
          alert("User not found. Try searching with their User ID found on their dashboard.");
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFollow = async (friendId, friendUsername, friendDisplayName) => {
    if (!currentUser) return;
    if (following.some(f => f.followingId === friendId)) {
      alert("You are already following this user!");
      return;
    }

    try {
      await client.models.Connection.create({
        followerId: currentUser.userId,
        followingId: friendId,
        followingUsername: friendUsername,
        followingName: friendDisplayName
      });
      setSearchResults([]);
      setSearchQuery('');
      alert(`Now following ${friendDisplayName || friendUsername}!`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="friends-feed-page">
      <div className="feed-header glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <h2>Friends Activity Feed</h2>
        <p style={{ color: 'var(--text-secondary)' }}>See what your friends are watching in real-time.</p>
        
        <form onSubmit={handleSearchFriend} style={{ display: 'flex', gap: '10px', marginTop: '20px', maxWidth: '500px' }}>
          <input 
            type="text" 
            placeholder="Search by Username or User ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        
        {searchResults.length > 0 && (
          <div style={{ marginTop: '15px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
            {searchResults.map(user => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '10px 0' }}>
                <div>
                  <span style={{ fontWeight: 'bold', display: 'block' }}>{user.displayName}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{user.username}</span>
                </div>
                <button className="btn-primary" style={{ padding: '5px 15px' }} onClick={() => handleFollow(user.id, user.username, user.displayName)}>Follow</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="content-section">
        {loading ? (
          <div className="loading-spinner">Updating feed...</div>
        ) : activities.length > 0 ? (
          <div className="movie-grid">
            {activities.map(act => (
              <div key={act.id} className="feed-item glass-panel" style={{ padding: '20px' }}>
                <p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                    {friendProfiles[act.userId] || act.username}
                  </span> watched:
                </p>
                <MovieCard movie={{ id: act.movieId, title: act.movieTitle, poster_path: act.posterPath }} />
                <div style={{ marginTop: '15px', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Rating: {act.rating}/10</span>
                  {act.review && <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginTop: '8px', color: 'var(--text-secondary)' }}>"{act.review}"</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Your feed is empty. Search for friends using their Username or User ID to see their activity here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
