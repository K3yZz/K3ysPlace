// Playlist with artist and title
const playlist = [
  {
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    src: "mainpage/home/music/never-gonna-give-you-up.mp3"
  }
];

let currentIndex = 0;
const audio = document.getElementById('audio');
const cover = document.getElementById('cover');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');

// Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 2048;
const bufferLength = analyser.fftSize;
const dataArray = new Uint8Array(bufferLength);

// Draw gradient wave
function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height); // keep it transparent

  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i];
    const barHeight = (v / 255) * canvas.height; // full height
    // Fully opaque gradient per bar (top-to-bottom)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#ff6ec7');
    gradient.addColorStop(0.3, '#ffb74d');
    gradient.addColorStop(0.6, '#4caf50');
    gradient.addColorStop(1, '#2196f3');
    ctx.fillStyle = gradient;

    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

// Fetch cover from iTunes API
function fetchCoverArt(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`);
  return fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
    .then(response => response.json())
    .then(data => {
      if (data.results && data.results[0] && data.results[0].artworkUrl100) {
        return data.results[0].artworkUrl100.replace('100x100bb', '500x500bb');
      } else {
        throw new Error('Cover not found');
      }
    });
}

// Load song
function loadSong(index) {
  const song = playlist[index];
  audio.src = song.src;

  // Update Now Playing text
  document.getElementById("npTitle").textContent = `${song.title} — ${song.artist}`;

  fetchCoverArt(song.artist, song.title)
    .then(url => cover.src = url)
    .catch(err => {
      console.error(err);
      cover.src = "";
    });

  audio.play();
  playBtn.textContent = '⏸️';
}

// Update progress bar
audio.addEventListener('timeupdate', () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.value = percent || 0;
  currentTime.textContent = formatTime(audio.currentTime);
  duration.textContent = formatTime(audio.duration);
});

progress.addEventListener('input', () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

// Controls
playBtn.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (audio.paused) {
    audio.play();
    playBtn.textContent = '⏸️';
  } else {
    audio.pause();
    playBtn.textContent = '▶️';
  }
});

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadSong(currentIndex);
});

nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  loadSong(currentIndex);
});

function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function resizeCanvasForHiDPI() {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.clientWidth;
  const ch = 25;
  canvas.width = Math.max(1, Math.floor(cw * dpr));
  canvas.height = Math.max(1, Math.floor(ch * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvasForHiDPI);
resizeCanvasForHiDPI();

// Initialize
loadSong(currentIndex);
audio.onplay = draw;
