import { Link } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';

export function MovieCard({ movie }) {
  if (!movie) return null;

  const posterUrl = tmdbService.getImageUrl(movie.poster_path);

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card-link">
      <div className="movie-card">
        <div className="movie-poster-container">
          <img 
            src={posterUrl} 
            alt={movie.title} 
            loading="lazy"
            className="movie-poster"
          />
          <div className="movie-overlay">
            <span className="movie-rating">★ {movie.vote_average?.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-year">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
      </div>
    </Link>
  );
}
