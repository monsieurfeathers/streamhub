const API_KEY = '213d830aae3a2f7b67e37f157405a42e';
const BASE_URL = 'https://api.tmdb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const OPTIONS = 'include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc';

//${https://api.tmdb.org/3}/discover/${mediaType}?api_key=${API_KEY}&with_networks=${networkId}&with_watch_providers=${providerId}&${OPTIONS}

// Sections to populate
const sections = {
  'trending-movies': `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&with_release_type=4&page=1`,
  'trending-series': `${BASE_URL}/trending/tv/week?api_key=${API_KEY}`,
  /* 'netflix': `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213&${OPTIONS}`,
  'amazon-prime': `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=1024&${OPTIONS}`,
  'apple-tv': `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=2552&${OPTIONS}` */
};

function loadDiscoverContent(networkId = 213, providerId = 8, mediaType = 'movie') {
  const url = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_networks=${networkId}&with_watch_providers=${providerId}&watch_region=US&${OPTIONS}`;
  const sectionId = 'discover-streaming';
  fetchContent(sectionId, url, limit = 12)
}

function sectionMediaType(sectionId) {
  const url = sections[sectionId];
  if (!url) return null;

  return url.includes("/tv") ? "tv" : "movie";
}

document.querySelectorAll(".tab-menu .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelector(".tab-menu .active").classList.remove("active");
    tab.classList.add("active");
    
    const networkId = tab.dataset.network;
    const providerId = tab.dataset.provider;
    const mediaType = document.querySelector(".media-switch input:checked").value;
    loadDiscoverContent(networkId, providerId, mediaType);
  });
});

document.querySelectorAll(".media-switch input").forEach(input => {
  input.addEventListener("change", () => {
    const mediaType = input.value;
    const networkId = document.querySelector(".tab-menu .active").dataset.network;
    loadDiscoverContent(networkId, mediaType);
  });
});


//
// Misc. functions 
function truncate(num, precision) {
  return Math.floor(num * Math.pow(10, precision)) / Math.pow(10, precision);
}

function extractYear(dateString) {
  const date = new Date(dateString);
  return date.getFullYear();
}

function capString(str, containerWidth) {
  const lines = str.split('\n'); // split the string into lines
  const wrappedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (wrappedLines.join('\n').length + line.length + 3 > containerWidth) { // 3 is for the ellipsis
      wrappedLines.push(line.substring(0, containerWidth - 3) + '..');
      break;
    }
    wrappedLines.push(line);
  }

  return wrappedLines.join('\n');
}
//
// Function to render grid items
function renderGridItems(items) {
  return items
    .map(item => {
      const title = item.title || item.name;
      const rating = truncate(item.vote_average, 1);
      const year = extractYear(item.release_date || item.first_air_date);
      const image = item.poster_path
        ? `${IMAGE_URL}${item.poster_path}`
        : 'https://placehold.co/440x661/383852/ccc?text=No+Image';
      return `
        <div class="grid-item popout" data-id="${item.id}" data-media-type="${item.media_type}">
          <div>
            <img src="${image}" alt="${title}">
          </div>
          <div class="grid-item-info">
            <h4>${capString(title, 44)}</h4>
            <h4>${rating}</h4>
            <p>${year}</p>
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

document.addEventListener("DOMContentLoaded", () => {
  loadDiscoverContent(213, 8, 'movie'); // Netflix and Movies as default
});

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
      url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,credits,images&include_image_language=en`;
    } else if (mediaType === "tv") {
      url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,images&include_image_language=en`;
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
  const gridItem = event.target.closest('.grid-item'); // Identify the clicked item
  if (!gridItem) return;

  const id = gridItem.dataset.id; // Get the ID of the item
  const sectionId = gridItem.closest('section')?.id; // Find the parent section's ID
  const mediaType = sectionId ? sectionMediaType(sectionId) : null;
  //console.error(id, sectionId, mediaType);
  if (!mediaType || !id) {
    console.error("Media type or ID not found");
    return;
  }

  fetchMetaData(mediaType, id).then(({ mediaType, data }) => {
    displayModal(mediaType, data);
  });
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
  const cast = data.credits.cast.map(cast => cast.name).slice(0, 7).join(", ");
  const date = convertDate(  data.release_date || data.first_air_date || data.air_date);  
  const logo = data.images?.logos?.[0]?.file_path
    ? `<img src="${IMAGE_URL}${data.images.logos[0].file_path}" alt="Logo">`
    : `<h1>${name}</h1>`;
  //window.history.pushState({}, '', `/${mediaType}/${name}`);


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
            <p><strong>Cast : ${cast}</strong></p>
            <p><strong>Release On : ${date}</strong></p>
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
          <p><strong>Cast : ${cast}</strong></p>
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
                <img src="${episode.still_path ? IMAGE_URL + episode.still_path : 'https://placehold.co/500x281?text=No+Image+Available'}" alt="Episode ${episode.episode_number}">
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
    window.location.href = `watch.html?type=movie&id=${id}&name=${name}`;
  }

  // Handle Episode Image Click (TV)
  if (event.target.closest(".episode img")) {
    const episodeElement = event.target.closest(".episode");
    const name = episodeElement.dataset.name;
    const id = episodeElement.dataset.id;
    const season = episodeElement.dataset.season;
    const episode = episodeElement.dataset.episode;
    window.location.href = `watch.html?type=tv&id=${id}&s=${season}&e=${episode}&name=${name}`;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mediaType = urlParams.get('type'); // movie or tv
  const id = urlParams.get('id');
  const name = urlParams.get('name')
  const season = urlParams.get('s');
  const episode = urlParams.get('e');

  if (mediaType && id) {
    loadWatchPage(mediaType, name, id, season, episode);
  }
});


function loadWatchPage(mediaType, name = null, id, season = null, episode = null) {
  let iframeSrc;
  if (mediaType === "movie") {
    info = `${name}`;
    iframeSrc = `https://vidlink.pro/movie/${id}`;
  } else if (mediaType === "tv") {
    info = `${name}: S${season}E${episode}`;
    iframeSrc = `https://vidlink.pro/tv/${id}/${season}/${episode}`; ///*https://www.2embed.skin/embedtv/${id}&s=${season}&e=${episode}*/
  }

    const watchPage = `
    <div class="watch-page">
    <div class="player-container">
        <!-- Placeholder until iframe loads -->
        <div class="loading">Loading player...</div>
        <iframe
          src="${iframeSrc}"
          frameborder="0"
          scrolling="no"
          allowfullscreen
          style="display: none;"
          onload="showIframe(this)"
        ></iframe>
        <h2>${info}</h2>
      </div>
    </div>
  `;
  document.querySelector("main").innerHTML = watchPage;
  window.history.pushState({}, '', `/watch/${id}${season && episode ? `/${season}/${episode}` : ''}`);
}

function goBack() {
  window.history.back();
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
  window.history.pushState({}, '', `/`);
  //window.history.back();
});

// Attach event listener for modal
document.addEventListener('click', openModal);
