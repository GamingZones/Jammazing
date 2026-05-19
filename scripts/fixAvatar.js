const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../Pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const oldAvatar = `<div class="profile-avatar-large">👤</div>`;
const newAvatar = `<div class="profile-avatar-large"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" fill="none"><circle cx="32" cy="24" r="13" fill="rgba(255,255,255,0.85)"/><ellipse cx="32" cy="54" rx="22" ry="13" fill="rgba(255,255,255,0.85)"/></svg></div>`;

let count = 0;
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldAvatar)) {
        content = content.replaceAll(oldAvatar, newAvatar);
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
        console.log('Fixed:', file);
    }
}
console.log('Total fixed:', count);
