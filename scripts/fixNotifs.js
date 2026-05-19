const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../Pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// Remove any remaining friend-item-floating blocks with hardcoded openFriendConversation calls
const friendItemPattern = /\s*<div class="friend-item-floating" onclick="openFriendConversation\('\d+', '[^']+'\)">\s*<div class="friend-avatar-floating">[^<]*<\/div>\s*<div class="friend-info">\s*<div class="friend-name-floating">[^<]*<\/div>\s*<div class="friend-status">[^<]*<\/div>\s*<\/div>\s*<\/div>/g;

let count = 0;
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const orig = content;
    content = content.replace(friendItemPattern, '');
    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
        console.log('Fixed:', file);
    }
}
console.log('Total fixed:', count);
