let currentSong = new Audio();
let songs = [];
let currfolder = "";

// Base URL of your GitHub repo folder where songs and info.json are stored
const GITHUB_BASE_URL = "https://menacefg78.github.io/Projects/songs/";

// Play button in the playbar (the play/pause img)
const playBtn = document.getElementById("play");


// Convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Fetch songs.json from a folder on GitHub Pages
async function getSongs(folder) {
  currfolder = folder;
  try {
    const res = await fetch(`${GITHUB_BASE_URL}${folder}/songs.json`);
    if (!res.ok) {
      console.error(`Failed to load songs.json from ${folder}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error(`Error fetching songs from ${folder}:`, e);
    return [];
  }
}

// Show songs in the left sidebar list
function showSongs(songListArray) {
  const songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";

  songListArray.forEach((song) => {
    const displayName = decodeURIComponent(song).replaceAll("%20", " ");
    songUL.innerHTML += `
      <li>
        <img src="music.svg" alt="music icon">
        <div class="info"><div>${displayName}</div></div>
        <div class="playNow">
          <span>Play Now</span>
          <img class="invert" src="play.svg" alt="play">
        </div>
      </li>`;
  });

  // Attach click listeners to each <li> to play song on click
  Array.from(songUL.querySelectorAll("li")).forEach((li) => {
    li.addEventListener("click", () => {
      const trackName = li.querySelector(".info div").textContent.trim();
      playMusic(trackName);
    });
  });
}

// Play a given track (with optional pause parameter)
function playMusic(track, pause = false) {
  // Ensure .mp3 extension
  let trackFile = track.toLowerCase().endsWith(".mp3") ? track : `${track}.mp3`;

  // Encode spaces and special chars properly for URL
  const encodedTrackFile = encodeURIComponent(trackFile).replace(/%20/g, "%20");

  const url = `${GITHUB_BASE_URL}${currfolder}/${encodedTrackFile}`;
  console.log("Playing song URL:", url);

  currentSong.pause();
  currentSong.src = url;
  currentSong.load();

  if (!pause) {
    currentSong.play().catch((err) => console.error("Play error:", err));
    if (playBtn) playBtn.src = "pause.svg";
  } else {
    if (playBtn) playBtn.src = "play.svg";
  }

  document.querySelector(".songinfo").textContent = trackFile;
  document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

// Load playlist and show songs from folder
async function loadPlaylist(folderName) {
  songs = await getSongs(folderName);
  if (songs.length === 0) {
    console.warn(`No songs found in folder ${folderName}`);
  }
  showSongs(songs);
  if (songs.length > 0) {
    playMusic(songs[0], true);
  }
}

// Display album cards from a list of album folders
async function displayAlbums() {
  const cardContainer = document.querySelector(".cardContainer");
  const albumFolders = ["cs", "ncs", "play1"]; // Add all your folders here

  cardContainer.innerHTML = ""; // Clear before adding cards

  for (const folder of albumFolders) {
    try {
      const res = await fetch(`${GITHUB_BASE_URL}${folder}/info.json`);
      if (!res.ok) {
        console.warn(`info.json not found for ${folder}`);
        continue;
      }
      const info = await res.json();
      cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play" aria-label="Play album ${info.title}" role="button" tabindex="0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </div>
          <img src="${GITHUB_BASE_URL}${folder}/cover.jpg" alt="Album Cover of ${info.title}">
          <h2>${info.title}</h2>
          <p>${info.description}</p>
        </div>`;
    } catch (e) {
      console.error(`Error loading album ${folder}`, e);
    }
  }
}

// MAIN function to setup everything
async function main() {
  await loadPlaylist("cs");
  await displayAlbums();

  // Play/Pause toggle button
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play()
          .then(() => {
            playBtn.src = "pause.svg";
          })
          .catch((err) => console.error("Play error:", err));
      } else {
        currentSong.pause();
        playBtn.src = "play.svg";
      }
    });
  }

  // Update seekbar and time display as song plays
  currentSong.addEventListener("timeupdate", () => {
    const currentTime = currentSong.currentTime;
    const duration = currentSong.duration || 0;
    document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentTime)} / ${secondsToMinutesSeconds(duration)}`;
    const percent = duration ? (currentTime / duration) * 100 : 0;
    document.querySelector(".circle").style.left = percent + "%";
  });

  // Clicking on seekbar to seek the song
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    const seekbarWidth = e.currentTarget.getBoundingClientRect().width;
    const clickX = e.offsetX;
    const percent = clickX / seekbarWidth;
    if (currentSong.duration) {
      currentSong.currentTime = currentSong.duration * percent;
      document.querySelector(".circle").style.left = percent * 100 + "%";
    }
  });

  // Hamburger menu open/close
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Previous song button
  const previousBtn = document.getElementById("previous");
  if (previousBtn) {
    previousBtn.addEventListener("click", () => {
      let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
      let index = songs.findIndex(s => s.toLowerCase() === currentFile.toLowerCase());
      if (index > 0) {
        playMusic(songs[index - 1]);
      }
    });
  }

  // Next song button
  const nextBtn = document.getElementById("next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
      let index = songs.findIndex(s => s.toLowerCase() === currentFile.toLowerCase());
      if (index >= 0 && index < songs.length - 1) {
        playMusic(songs[index + 1]);
      }
    });
  }

  // Volume slider control
  const volumeSlider = document.querySelector(".range input");
  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      currentSong.volume = e.target.value / 100;
    });
  }

  // Volume mute/unmute toggle on volume icon click
  const volumeIcon = document.querySelector(".volume > img");
  if (volumeIcon) {
    volumeIcon.addEventListener("click", () => {
      if (volumeIcon.src.includes("volume.svg")) {
        volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
        currentSong.volume = 0;
        if (volumeSlider) volumeSlider.value = 0;
      } else {
        volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
        currentSong.volume = 0.1;
        if (volumeSlider) volumeSlider.value = 10;
      }
    });
  }

  // Event delegation: clicking album cards to load playlist
  document.querySelector(".cardContainer").addEventListener("click", async (e) => {
    const card = e.target.closest(".card");
    if (card && card.dataset.folder) {
      await loadPlaylist(card.dataset.folder);
      if (songs.length > 0) {
        playMusic(songs[0], false);
      }
    }
  });
}

main();
