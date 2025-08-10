let currentSong = new Audio();
let songs = [];
let currfolder = "";

const GITHUB_BASE_URL = "https://menacefg78.github.io/songs/";

// Convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch song list from songs.json inside folder on GitHub Pages
async function getSongs(folder) {
    currfolder = folder;
    let res = await fetch(`${GITHUB_BASE_URL}${folder}/songs.json`);
    if (!res.ok) {
        console.error(`Failed to load songs.json from ${folder}`);
        return [];
    }
    let songList = await res.json();
    return songList;
}

// Show song list in the UI
function showSongs(songListArray) {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songListArray) {
        songUL.innerHTML += `
            <li>
                <img src="music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                </div>
                <div class="playNow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    }

    // Song click -> play music
    Array.from(songUL.getElementsByTagName("li")).forEach(li => {
        li.addEventListener("click", () => {
            playMusic(li.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });
}

// Play the selected music track
const playMusic = (track, pause = false) => {
    currentSong.src = `${GITHUB_BASE_URL}${currfolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    } else {
        play.src = "play.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
};

// Load playlist from a given folder name
async function loadPlaylist(folderName) {
    songs = await getSongs(folderName);
    showSongs(songs);
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }
}

// Display album cards from predefined album folders
async function displayAlbums() {
    console.log("displaying albums");
    let cardContainer = document.querySelector(".cardContainer");

    // Replace this with your actual album folder names
    let albumFolders = ["ncs", "album2", "album3"];

    for (const folder of albumFolders) {
        try {
            let meta = await fetch(`${GITHUB_BASE_URL}${folder}/info.json`);
            if (!meta.ok) {
                console.warn(`info.json not found for ${folder}`);
                continue;
            }
            let info = await meta.json();

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="${GITHUB_BASE_URL}${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        } catch (error) {
            console.error(`Error loading album ${folder}`, error);
        }
    }
}

async function main() {
    // Load default playlist (first folder from albumFolders)
    await loadPlaylist("ncs");

    // Display all albums
    await displayAlbums();

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    // Time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous song
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next song
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Mute/unmute button
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });

    // Event Delegation for dynamically added album cards
    document.querySelector(".cardContainer").addEventListener("click", async (e) => {
        let card = e.target.closest(".card");
        if (card && card.dataset.folder) {
            await loadPlaylist(card.dataset.folder);

            if (songs.length > 0) {
                playMusic(songs[0], false);
            }
        }
    });
}

main();
