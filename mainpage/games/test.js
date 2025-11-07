const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'games.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Recursively update every icon in the JSON
function updateIcons(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(updateIcons);
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.icon) {
      const sanitizedTitle = obj.title ? obj.title.replace(/\s+/g, '').toLowerCase() : 'unknown';
      obj.icon = `/portedgames/${sanitizedTitle}.png`;
      console.log(`Updated icon for: ${obj.title || 'unknown'}`);
    }
    Object.values(obj).forEach(updateIcons);
  }
}

updateIcons(data);

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log('All icons updated successfully!');
