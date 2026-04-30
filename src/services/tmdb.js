const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbService = {
  async getTrendingMovies() {
    try {
      const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch trending movies');
      return await response.json();
    } catch (error) {
      console.error(error);
      return { results: [] };
    }
  },

  async getTrendingMoviesMonthly() {
    try {
      // TMDB doesn't have a direct /day or /month for all, but we can simulate or use 'day'
      // For 'month', we usually use discover with date ranges, or just use the week trending as a proxy if month is not available.
      // TMDB Trending is either 'day' or 'week'.
      // To get monthly trending, we can use discover with popularity.
      const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`);
      if (!response.ok) throw new Error('Failed to fetch monthly trending');
      return await response.json();
    } catch (error) {
      console.error(error);
      return { results: [] };
    }
  },

  async getTopRatedMovies() {
    try {
      const response = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch top rated movies');
      return await response.json();
    } catch (error) {
      console.error(error);
      return { results: [] };
    }
  },

  async searchMovies(query) {
    if (!query) return { results: [] };
    try {
      const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search movies');
      return await response.json();
    } catch (error) {
      console.error(error);
      return { results: [] };
    }
  },

  async getMovieDetails(id) {
    try {
      const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch movie details');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  
  getImageUrl(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
};
