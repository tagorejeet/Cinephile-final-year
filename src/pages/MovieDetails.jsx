import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

// eslint-disable-next-line no-undef
const client = generateClient();

export function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [logStatus, setLogStatus] = useState('');

  useEffect(() => {
    async function fetchMovie() {
      setLoading(true);
      const data = await tmdbService.getMovieDetails(id);
      setMovie(data);
      setLoading(false);
    }
    fetchMovie();
  }, [id]);

  const handleLogMovie = async () => {
    try {
      setLogStatus('Logging...');
      const user = await getCurrentUser();
      
      await client.models.MovieActivity.create({
        userId: user.userId,
        username: user.username || user.signInDetails?.loginId || 'User',
        movieId: parseInt(id),
        movieTitle: movie.title,
        posterPath: movie.poster_path,
        rating: parseFloat(rating),
        review: review
      });
      
      setLogStatus('Logged successfully!');
      setTimeout(() => setShowModal(false), 1500);
    } catch (error) {
      console.error(error);
      setLogStatus('Error logging movie (ensure you are signed in).');
    }
  };

  if (loading) return <div className="container" style={{marginTop: '40px'}}>Loading...</div>;
  if (!movie) return <div className="container" style={{marginTop: '40px'}}>Movie not found.</div>;

  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '';
  const posterUrl = tmdbService.getImageUrl(movie.poster_path);

  return (
    <div className="movie-details-page">
      {backdropUrl && (
        <div 
          className="movie-backdrop" 
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      
      <div className="container details-container">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <div className="details-content glass-panel">
          <div className="details-poster-wrapper">
            <img src={posterUrl} alt={movie.title} className="details-poster" />
          </div>
          
          <div className="details-info">
            <h1 className="details-title">
              {movie.title} <span className="details-year">({new Date(movie.release_date).getFullYear()})</span>
            </h1>
            <div className="details-meta">
              <span className="details-rating">★ {movie.vote_average?.toFixed(1)}</span>
              <span>•</span>
              <span>{movie.runtime} min</span>
              <span>•</span>
              <span>{movie.genres?.map(g => g.name).join(', ')}</span>
            </div>
            
            <p className="details-tagline">{movie.tagline}</p>
            
            <div className="details-overview">
              <h3>Overview</h3>
              <p>{movie.overview}</p>
            </div>
            
            <div className="action-buttons">
              <button className="btn-log" onClick={() => setShowModal(true)}>Log / Rate Movie</button>
              <button className="btn-secondary">Add to Watchlist</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3>Log "{movie.title}"</h3>
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Rating (0-10)</label>
              <input 
                type="number" 
                min="0" max="10" step="0.5" 
                value={rating} 
                onChange={(e) => setRating(e.target.value)} 
                style={{ width: '100%', marginBottom: '15px' }}
              />
              
              <label style={{ display: 'block', marginBottom: '5px' }}>Review (optional)</label>
              <textarea 
                rows="4" 
                value={review}
                onChange={(e) => setReview(e.target.value)}
                style={{ width: '100%', marginBottom: '15px' }}
                placeholder="What did you think?"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-log" onClick={handleLogMovie}>Save to Log</button>
            </div>
            {logStatus && <p style={{ marginTop: '15px', color: logStatus.includes('Error') ? 'var(--danger-color)' : 'var(--success-color)' }}>{logStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
