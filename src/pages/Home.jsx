import { useState, useEffect } from 'react';
import { tmdbService } from '../services/tmdb';
import { MovieCard } from '../components/MovieCard';

export function Home() {
  const [weeklyTrending, setWeeklyTrending] = useState([]);
  const [monthlyTrending, setMonthlyTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [weekly, monthly, top] = await Promise.all([
          tmdbService.getTrendingMovies(),
          tmdbService.getTrendingMoviesMonthly(),
          tmdbService.getTopRatedMovies()
        ]);
        setWeeklyTrending(weekly.results || []);
        setMonthlyTrending(monthly.results || []);
        setTopRated(top.results || []);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const data = await tmdbService.searchMovies(searchQuery);
    setSearchResults(data.results || []);
    setLoading(false);
  };

  return (
    <div className="home-page">
      <div className="hero-section glass-panel">
        <h2 className="hero-title">Track films you've watched.</h2>
        <p className="hero-subtitle">Save those you want to see. Tell your friends what's good.</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            placeholder="Search for a movie..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>

      <div className="content-section">
        {searchQuery ? (
          <>
            <h3 className="section-title">Search Results</h3>
            {loading ? <div className="loading-spinner">Searching...</div> : (
              <div className="movie-grid">
                {searchResults.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <section style={{ marginBottom: '50px' }}>
              <h3 className="section-title">Trending This Week</h3>
              <div className="movie-grid">
                {weeklyTrending.slice(0, 10).map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>

            <section style={{ marginBottom: '50px' }}>
              <h3 className="section-title">Trending This Month</h3>
              <div className="movie-grid">
                {monthlyTrending.slice(0, 10).map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>

            <section style={{ marginBottom: '50px' }}>
              <h3 className="section-title">Top Rated Movies</h3>
              <div className="movie-grid">
                {topRated.slice(0, 10).map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
