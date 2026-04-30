import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { MovieCard } from '../components/MovieCard';

const client = generateClient();

export function FriendProfile() {
  const { userId: profileId } = useParams();
  const [searchParams] = useSearchParams();
  const defaultUsername = searchParams.get('username') || 'Friend';
  const [displayName, setDisplayName] = useState(defaultUsername);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFriendData() {
      setLoading(true);
      try {
        // Fetch profile to get real name
        const { data: profile } = await client.models.UserProfile.get({
          userId: profileId
        });
        if (profile) {
          setDisplayName(`${profile.name} ${profile.surname || ''}`.trim());
        }

        // Fetch activities
        const { data: items } = await client.models.MovieActivity.list({
          filter: { userId: { eq: profileId } }
        });
        const sorted = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(sorted);
      } catch (err) {
        console.error("Error fetching friend's data", err);
      } finally {
        setLoading(false);
      }
    }
    loadFriendData();
  }, [profileId]);

  return (
    <div className="friend-profile-page">
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <Link to="/following" style={{ marginBottom: '15px', display: 'inline-block' }}>← Back to Friends</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#000' }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{displayName}'s Log</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Seeing what {displayName} has been watching lately.</p>
          </div>
        </div>
      </div>

      <div className="content-section">
        <h3 className="section-title">{displayName}'s Movies</h3>
        
        {loading ? (
          <p>Loading {displayName}'s history...</p>
        ) : activities.length > 0 ? (
          <div className="movie-grid">
            {activities.map(act => (
              <div key={act.id} style={{ position: 'relative' }}>
                <MovieCard movie={{ id: act.movieId, title: act.movieTitle, poster_path: act.posterPath }} />
                <div style={{ marginTop: '10px', textAlign: 'center', backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Rating: {act.rating} / 10</span>
                  {act.review && <p style={{ fontSize: '0.9rem', marginTop: '5px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{act.review}"</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>{displayName} hasn't logged any movies yet.</p>
        )}
      </div>
    </div>
  );
}
