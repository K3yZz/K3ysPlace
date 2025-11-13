// Detect base path based on hosting
const BASE_PATH = location.hostname.includes("github.io") ? "/K3ysPlace/" : "/";
console.log(BASE_PATH);

// Update all <img> elements with data-src
document.querySelectorAll('img[data-src]').forEach(img => {
  img.src = BASE_PATH + img.getAttribute('data-src');
});

// Update all <a> elements with data-href
document.querySelectorAll('a[data-href]').forEach(link => {
  link.href = BASE_PATH + link.getAttribute('data-href');
});

// Update buttons with data-href (optional)
document.querySelectorAll('button[data-href]').forEach(button => {
  button.onclick = () => {
    window.location.href = BASE_PATH + button.getAttribute('data-href');
  };
});
