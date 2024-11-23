const API_KEY = '213d830aae3a2f7b67e37f157405a42e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Sections to populate
const sections = {
    'trending-movies': `${BASE_URL}/trending/movie/day?api_key=${API_KEY}`,
    'trending-series': `${BASE_URL}/trending/tv/day?api_key=${API_KEY}`,
    'netflix': `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=213`,
    'amazon-prime': `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=1024`,
    'apple-tv': `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=2552`
};

// Fetch and display data
async function fetchContent(sectionId, url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        populateSection(sectionId, data.results.slice(0, 10));
    } catch (error) {
        console.error(`Error fetching data for ${sectionId}:`, error);
    }
}

// Populate a section with content
function populateSection(sectionId, items) {
    const container = document.querySelector(`#${sectionId} .grid-container`);
    container.innerHTML = items
        .map(item => {
            const title = item.title || item.name;
            const image = item.poster_path
                ? `${IMAGE_URL}${item.poster_path}`
                : 'https://via.placeholder.com/200x300?text=No+Image';
            return `
                <div class="grid-item">
                    <div class="grid-item-cover">
                        <img src="${image}" alt="${title}">
                    </div>
                    <div class="grid-item-title">
                        <h3>${title}</h3>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Load content for each section
Object.entries(sections).forEach(([sectionId, url]) => {
    fetchContent(sectionId, url);
});
