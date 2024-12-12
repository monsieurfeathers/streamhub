const API_KEY = "213d830aae3a2f7b67e37f157405a42e";
const BASE_URL = 'https://api.tmdb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const OPTIONS = 'include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc';

// Sections to populate
const sections = {
  'trending-movies': `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&with_release_type=4&page=1`,
  'trending-series': `${BASE_URL}/trending/tv/week?api_key=${API_KEY}`,
};

function loadDiscoverContent(networkId = 213, providerId = 8, mediaType = 'movie') {
  const url = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_networks=${networkId}&with_watch_providers=${providerId}&watch_region=US&${OPTIONS}`;
  const sectionId = 'discover-streaming';
  fetchContent(sectionId, url, limit = 14)
}

function sectionMediaType(sectionId) {
  //return document.getElementById(sectionId).dataset.type;
  
  if (sectionId === "discover-streaming") {
    return document.querySelector(".media-switch .active").dataset.type; // Returns either 'movie' or 'tv'
  }
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
    const mediaType = document.querySelector(".media-switch .active").dataset.type;
    console.error(mediaType, networkId, providerId);
    loadDiscoverContent(networkId, providerId, mediaType);
  });
});

document.querySelectorAll(".media-tab").forEach(button => {
  button.addEventListener("click", () => {
    // Remove the active class from all buttons
    document.querySelector(".media-tab.active").classList.remove("active");

    // Add the active class to the clicked button
    button.classList.add("active");

    // Get the selected media type
    const mediaType = button.dataset.type;
    const networkId = document.querySelector(".tab-menu .active").dataset.network;
    const providerId = document.querySelector(".tab-menu .active").dataset.provider;
    console.error(mediaType, networkId, providerId);
    // Load content dynamically
    loadDiscoverContent(networkId, providerId, mediaType);
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
 //const mediaType = document.querySelector("section").dataset.type? type : null;
  return items
    .map(item => {
      const title = item.title || item.name;
      const rating = truncate(item.vote_average, 1);
      const year = extractYear(item.release_date || item.first_air_date);
      const image = item.poster_path
        ? `${IMAGE_URL}${item.poster_path}`
        : 'https://placehold.co/440x661/383852/ccc?text=No+Image';
      return `
        <div class="grid-item" data-id="${item.id}" data-media-type="${item.media_type}">
          <div>
            <img src="${image}" alt="${title}">
          </div>
          <div class="grid-item-info">
            <p>${capString(title, 45)}</p>
            <p>${rating}</p>
            <p>${year}</p>
          </div>
        </div>
      `;
    })
    .join('');
}

// Fetch and display data with a customizable limit
async function fetchContent(sectionId, url, limit = 14) {
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
  const movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  const tvUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  const peopleUrl = `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    var [movie, tv, people] = await Promise.all([
      fetch(movieUrl).then(res => res.json()),
      fetch(tvUrl).then(res => res.json()),
      fetch(peopleUrl).then(res => res.json())
    ]);

  var movie = movie.results.slice(0, 7).map(item => ({ ...item, media_type: 'movie' }));
  var tv = tv.results.slice(0, 7).map(item => ({ ...item, media_type: 'tv' }));
  var people = people.results.slice(0, 7).map(item => ({ ...item, media_type: 'person' }));


    displaySearchResults({ movie, tv, people}, query);
  } catch (error) {
    console.error("Error fetching search results:", error);
  }
}

// Display search results

function displaySearchResults({ movie, tv, people }, query) {
  const mainContent = document.querySelector('main');
  mainContent.innerHTML = `
    <div id=search-results>
    <h1>Search Results for "${query}"</h1>
    <section id="movie-results" data-type="movie">
      <h3>Movies</h3>
      <div class="grid-container">
        ${renderGridItems(movie)}        
      </div>
    </section>
    <section id="tv-results" data-type="tv">
      <h3>TV Shows</h3>
      <div class="grid-container">
        ${renderGridItems(tv)}
      </div>
    </section>
    <section id="people-results" data-type="people">
    <h3>People</h3>
      <div class="grid-container">
      ${renderProfile(people)}  
      </div>
    </section>
    <div id="info-modal" class="modal">
      <div class="modal-content">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <div id="modal-details"></div>
      </div>
    </div>
    </div>
  `;
}

function renderProfile(items) {
  return items
    .map(item => {
      const name = item.name || item.original_name;
 //     const rating = truncate(item.vote_average, 1);
//    const year = extractYear(item.release_date || item.first_air_date);
      const image = item.profile_path
        ? `${IMAGE_URL}${item.profile_path}`
        : 'https://placehold.co/440x661/383852/ccc?text=No+Image';
      return `
        <div class="profile-item" data-id="${item.id}" data-media-type="${item.media_type}">
          <div>
            <img src="${image}" alt="${name}">
          </div>
          <div class="profile-item-info">
            <p>${capString(name, 30)}</p>
          </div>
        </div>
      `;
    })
    .join('');
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
  const mediaType = gridItem.closest('section')?.dataset.type ? gridItem.closest('section')?.dataset.type : sectionId ? sectionMediaType(sectionId) : null;
//  const mediaType = sectionId ? sectionMediaType(sectionId) : null;
  console.log(id,mediaType,sectionId);
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
  const cast = data.credits.cast.map(cast => cast.name).slice(0, 5).join(", ");
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
        </div>
      </div>
      <div><button class="watch-btn" data-name="${name}" data-id="${id}">Watch</button></div>
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
    const id = event.target.dataset.id;
    const name = event.target.dataset.name;
    const mediaType = "movie";
    const season = episode = null;
  //  window.location.href = `/watch/${mediaType}/${id}/${name}`;
    loadWatchPage(mediaType, name, id, season, episode);
  }

  // Handle Episode Image Click (TV)
  if (event.target.closest(".episode img")) {
    const episodeElement = event.target.closest(".episode");
    const name = episodeElement.dataset.name;
    const id = episodeElement.dataset.id;
    const season = episodeElement.dataset.season;
    const episode = episodeElement.dataset.episode;
    const mediaType = "tv";
   // window.location.href = `/watch/${mediaType}/${id}/${name}${season && episode ? `/${season}/${episode}` : ''}`;
  
    loadWatchPage(mediaType, name, id, season, episode);
  }
});

/* document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.split('/').filter(Boolean);

  const mediaType = path[0]; // "movie" or "tv"
  const id = path[1]; // ID of the media
  const name = path[2]; // Name of the media
  const season = path[3]; // Season number (if any)
  const episode = path[4]; // Episode number (if any)

  if (mediaType && id && name) {
    console.log(mediaType, name, id, season, episode);
    loadWatchPage(mediaType, name, id, season, episode);
  }
}); */



function loadWatchPage(mediaType, name = null, id, season = null, episode = null) {
  const info = `${mediaType === "movie" ? name : `S${season}:E${episode} ${name}`}`;
  let source = 1;

  const watchPage = `
    <div class="watch-page">
      <h2>${info}</h2>
      <div class="player-container">
        <div class="player">
          <!-- Placeholder until iframe loads -->
          <div class="loading">Loading player...</div>
          <div class="iframe-container">
          </div>
          <div class="player-toolbar">
            <div class="provider-menu">
              <button class="provider-change">Provider</button>
              <div class="providers">
                <p data-source="1">Vidlink</p>
                <p data-source="2">Embed.su</p>
                <p data-source="3">Vidsrc</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelector("main").innerHTML = watchPage;
  document.querySelector("title").innerHTML = info;

  // Initialize default source
  loadSources(source, mediaType, id, season, episode);

  // Add event listeners to dropdown items
  const sourceItems = document.querySelectorAll('.providers p');
  sourceItems.forEach(item => {
    item.addEventListener('click', () => {
      const selectedSource = parseInt(item.getAttribute('data-source'), 10); // Ensure source is an integer
      if (selectedSource && selectedSource !== source) {
        source = selectedSource; // Update the source
        loadSources(source, mediaType, id, season, episode);
      }
    });
  });
  
  //window.history.pushState({}, '', `/watch/${mediaType}/${id}/${name}${season && episode ? `/${season}/${episode}` : ''}`);
}

function loadSources(source, mediaType, id, season = null, episode = null) {
  console.log(source);
  let src = "";
  switch (source) {
    case 1:
      src = `https://vidlink.pro/${mediaType}/${id}${season && episode ? `/${season}/${episode}` : ''}`;
      break;
    case 2:
      src = `https://embed.su/embed/${mediaType}/${id}${season && episode ? `/${season}/${episode}` : ''}`;
      break;
    case 3:
      src = `https://vidsrc.icu/embed/${mediaType}/${id}${season && episode ? `/${season}/${episode}` : ''}`;
      break;
    default:
      console.error("Invalid source selected");
      return;
  }

  const loadIframe = `
          <iframe
          src="${src}"
          referrerpolicy="origin"
          frameborder="0"
          scrolling="no"
          allowfullscreen
          style="display: none;"
          onload="showIframe(this)"
        ></iframe>
        `;
  document.querySelector(".iframe-container").innerHTML = loadIframe;

}

function showIframe(iframe) {
  iframe.style.display = "block";
  document.querySelector(".loading").style.display = "none";
}

function goBack() {
  window.history.back();
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
function closeModal() {
  document.getElementById('info-modal').style.display = 'none';
  //window.history.pushState({}, '', `/`);
  //window.history.back();
}
let lastScrollY = window.scrollY;
let isScrollingDown = false;
let hideTimeout;

window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  
  if (window.scrollY > lastScrollY) {
    // Scrolling down
    if (!isScrollingDown) {
      isScrollingDown = true;
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        header.classList.add('hidden');
      }, 500); // 200ms delay before hiding
    }
  } else {
    // Scrolling up
    isScrollingDown = false;
    clearTimeout(hideTimeout); // Cancel any pending hide
    header.classList.remove('hidden'); // No delay to reappear
  }
  lastScrollY = window.scrollY;
});



// Attach event listener for modal
document.addEventListener('click', openModal);
