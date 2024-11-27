const API_KEY = '213d830aae3a2f7b67e37f157405a42e';
const BASE_URL = 'https://api.tmdb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Sections to populate
const sections = {
  'trending-movies': `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&with_release_type=4&page=1`,
  'trending-series': `${BASE_URL}/trending/tv/week?api_key=${API_KEY}`,
  'netflix': `${BASE_URL}/discover/tv?api_key=${API_KEY}&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc&with_networks=213`,
  'amazon-prime': `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=1024`,
  'apple-tv': `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=2552`
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
        <div class="grid-item" data-id="${item.id}" data-media-type="${item.media_type}">
          <div>
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
    <div id="info-modal" class="modal">
      <div class="modal-content">
        <span class="close-btn">&times;</span>
          <div id="modal-details">
          </div>
      </div>
    </div>
  `;
}

//fetch Metadata
async function fetchMetaData(mediaType, id) {
  try {
    let url;

    if (mediaType === "movie") {
      url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=images&include_image_language=en`;
    } else if (mediaType === "tv") {
      url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=images&include_image_language=en`;
      }
      const response = await fetch(url);
      const data = await response.json();
      return {data, mediaType};
    } catch (error) {
      console.error("Error fetching modal data:", error);
      return null;
    }
}

async function openModal(event) {
  const gridItem = event.target.closest(".grid-item");
  if (gridItem) {
    const mediaType = gridItem.dataset.mediaType;
    const id = gridItem.dataset.id;

  fetchMetaData(mediaType, id).then(({mediaType, data}) => {
      displayModal(mediaType, data);
  });
  }
}

function convertDate(dateString) {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  return formatter.format(new Date(dateString));
}

// Display modal with fetched data
function displayModal(mediaType, data) {
  //const modal = document.querySelector(".modal-content");
  const modal = document.getElementById('info-modal');
  const details = document.getElementById('modal-details');
  const id = data.id;
  const name = data.name || data.title || data.original_title;
  const date = convertDate(  data.release_date || data.first_air_date || data.air_date);
  
  const logo = data.images?.logos?.[0]?.file_path
    ? `<img src="${IMAGE_URL}${data.images.logos[0].file_path}" alt="Logo">`
    : `<h1>${name}</h1>`;
  
  if (mediaType === "movie") {
    details.innerHTML = `
      <div class="modal-media">
        <div class="modal-cover">
          <img src="${IMAGE_URL}${data.poster_path}" alt="${name}"></img>
        </div>
        <div class="modal-info">
            ${logo || name}
            <p><strong>${data.genres.map(genre => genre.name).join(", ")}</strong></p>
            <p>${data.overview || 'No description available.'}</p>
            <p>Release Date: ${date}</p>
          <div><button class="watch-btn" data-name="${name}" data-id="${id}">Watch</button></div>
        </div>
      </div>
    `;
    modal.style.display = 'block';

  } else 
  if (mediaType === "tv") {
    const seasons = data.seasons.reverse();
    details.innerHTML = `
      <div class="modal-media">
        <div class="modal-cover">
          <img src="${IMAGE_URL}${data.poster_path}" alt="${name}"></img>
        </div>
        <div class="modal-info">
          ${logo || name}
          <p><strong> ${data.genres.map(genre => genre.name).join(", ")}</strong></p>
          <p>${data.overview || 'No description available.'}</p>
          <p>First Air Date: ${date}</p>
        </div>
      </div>
      <div class="season-info">
        <div class="seasons-menu">
          <select id="season-dropdown">
            ${seasons
              .map(season => `
                <option value="${season.season_number}">${season.name}</option>
              `)
              .join("")}
          </select>
        </div>
        <div class="episode-container" id="episode-container">
        </div>
      </div>
    `;
    modal.style.display = 'block';

    // Fetch and display episodes for the selected season
    const seasonDropdown = document.getElementById('season-dropdown');
    const episodeContainer = document.getElementById('episode-container');

    seasonDropdown.addEventListener('change', async (event) => {
      const selectedSeason = event.target.value;
      try {
        const response = await fetch(`${BASE_URL}/tv/${data.id}/season/${selectedSeason}?api_key=${API_KEY}`);
        const seasonData = await response.json();
        episodeContainer.innerHTML = seasonData.episodes
          .map(episode => `
            <div class="episode" data-name="${data.name}" data-id="${data.id}" data-season="${selectedSeason}" data-episode="${episode.episode_number}">
              <div class="episode-items">
                <img src="${episode.still_path ? IMAGE_URL + episode.still_path : 'https://via.placeholder.com/300x169?text=No+Image'}" alt="Episode ${episode.episode_number}">
                <div class="episode-info">
                  <h3>${episode.episode_number}. ${episode.name}</h3>
                  <p>Rated: ${episode.vote_average.toFixed(1)}</p>
                  <p>${convertDate(episode.air_date)}</p>
                </div>
                <p>${episode.overview || "No overview available"}</p>
              </div>
            </div>
          `)
          .join("");
      } catch (error) {
        console.error('Error fetching season details:', error);
        episodeContainer.innerHTML = `<p>Failed to load episodes for Season ${selectedSeason}.</p>`;
      }
    });

    seasonDropdown.dispatchEvent(new Event('change'));
  }
}

document.addEventListener("click", (event) => {
  // Handle Watch Button (Movie)
  if (event.target.classList.contains("watch-btn")) {
    const id = event.target.dataset.id; // Get the movie ID
    const name = event.target.dataset.name;
    loadWatchPage("movie", name, id);
  }

  // Handle Episode Image Click (TV)
  if (event.target.closest(".episode img")) {
    const episodeElement = event.target.closest(".episode");
    const name = episodeElement.dataset.name;
    const id = episodeElement.dataset.id;
    const season = episodeElement.dataset.season;
    const episode = episodeElement.dataset.episode;
    loadWatchPage("tv", name, id, season, episode);
  }
});

function loadWatchPage(mediaType, name, id, season, episode) {
  let iframeSrc;

  if (mediaType === "movie") {
    info = `${name}`;
    iframeSrc = `https://vidlink.pro/movie/${id}`;
  } else if (mediaType === "tv") {
    info = `${name}:S${season}E${episode}`;
    iframeSrc = `https://vidlink.pro/tv/${id}/${season}/${episode}`;
  }

  // Create the embed page
  const watchPage = `
    <div class="watch-page">
    <div class="player-container">
        <!-- Placeholder until iframe loads -->
        <div class="loading">Loading player...</div>
        <iframe
          src="${iframeSrc}"
          frameborder="0"
          allowfullscreen
          style="display: none;"
          onload="showIframe(this)"
        ></iframe>
      </div>
    <h1>${info}</h1>
    </div>
  `;

  // Replace main content with the watch page
  const mainContent = document.querySelector("main");
  mainContent.innerHTML = watchPage;
}


function showIframe(iframe) {
  iframe.style.display = "block";
  document.querySelector(".loading").style.display = "none";
}



function showIframe(iframe) {
  // Hide the loading div and show the iframe
  iframe.style.display = "block";
  document.querySelector(".loading").style.display = "none";
}

// Listen to popstate events for navigation
window.addEventListener("popstate", (event) => {
  if (event.state?.page === "watch") {
    loadWatchPage(event.state.id);
  } else {
    loadHomePage(); // Custom function to load home page
  }
});

// Close modal on click
document.querySelector('.close-btn').addEventListener('click', () => {
  document.getElementById('info-modal').style.display = 'none';
});

// Attach event listener for modal
document.addEventListener('click', openModal);
