const API_KEY = '213d830aae3a2f7b67e37f157405a42e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Sections to populate
const sections = {
  'trending-movies': `${BASE_URL}/trending/movie/day?api_key=${API_KEY}`,
  'trending-series': `${BASE_URL}/trending/tv/day?api_key=${API_KEY}`,
  'netflix': `${BASE_URL}/trending/movie?api_key=${API_KEY}&with_networks=213`,
  'amazon-prime': `${BASE_URL}/trending/movie?api_key=${API_KEY}&with_networks=1024`,
  'apple-tv': `${BASE_URL}/trending/movie?api_key=${API_KEY}&with_networks=2552`
};

// Function to render grid items
function renderGridItems(items) {
  return items
    .map(item => {
      const title = item.title || item.name;
      const image = item.poster_path
        ? `${IMAGE_URL}${item.poster_path}`
        : 'https://via.placeholder.com/200x300?text=No+Image';
      return `
        <div class="grid-item" data-id="${item.id}" data-media-type="${item.media_type || 'movie'}">
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

// Fetch and display data with a customizable limit
async function fetchContent(sectionId, url, limit = 12) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    populateSection(sectionId, data.results.slice(0, limit));
  } catch (error) {
    console.error(`Error fetching data for ${sectionId}:`, error);
  }
}

// Populate a section with content
function populateSection(sectionId, items) {
  const container = document.querySelector(`#${sectionId} .grid-container`);
  container.innerHTML = renderGridItems(items);
}

// Load content for each section
Object.entries(sections).forEach(([sectionId, url]) => {
  fetchContent(sectionId, url);
});

// Handle "show more" and "collapse" for sections
function expandSection(sectionId) {
  const sectionUrl = sections[sectionId];
  fetchContent(sectionId, sectionUrl, 24);

  document.querySelector(`#${sectionId} .show-more`).style.display = 'none';
  document.querySelector(`#${sectionId} .collapse`).style.display = 'block';
}

function collapseSection(sectionId) {
  const sectionUrl = sections[sectionId];
  fetchContent(sectionId, sectionUrl, 12);

  document.querySelector(`#${sectionId} .collapse`).style.display = 'none';
  document.querySelector(`#${sectionId} .show-more`).style.display = 'block';
}

// Handle Search
async function handleSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    alert('Please enter a search term!');
    return;
  }

  const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    displaySearchResults(data.results);
  } catch (error) {
    console.error('Error fetching search results:', error);
  }
}

// Display search results
function displaySearchResults(results) {
  const mainContent = document.querySelector('main');
  mainContent.innerHTML = `
    <section id="search-results">
      <h2>Search Results</h2>
      <div class="grid-container">
        ${renderGridItems(results)}
      </div>
    </section>
  `;
}

// Open modal and fetch details
async function openModal(event) {
  const gridItem = event.target.closest('.grid-item');
  if (gridItem) {
    const mediaType = gridItem.dataset.mediaType;
    const id = gridItem.dataset.id;

    try {
      const response = await fetch(`${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}`);
      const data = await response.json();
      displayModal(data, mediaType);
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  }
}

// Display modal with fetched data
function displayModal(data, mediaType) {
  const modal = document.getElementById('info-modal');
  const details = document.getElementById('modal-details');
  details.innerHTML = `   
    <div class="modal-cover">
        <img src="${IMAGE_URL}${data.poster_path}" alt="${data.title || data.name}">
    </div>
    <div class="modal-info">
        <div class="modal-title">
            <h1>${data.title || data.name}</h1>
        </div>
        <div>
            <p>${data.overview || 'No description available.'}</p>
            <p><strong>Release Date:</strong> ${data.release_date || data.first_air_date}</p>
        </div>
    </div>

  `;
  modal.style.display = 'block';
}

// Close modal on click
document.querySelector('.close-btn').addEventListener('click', () => {
  document.getElementById('info-modal').style.display = 'none';
});

// Attach event listener for modal
document.body.addEventListener('click', openModal);
