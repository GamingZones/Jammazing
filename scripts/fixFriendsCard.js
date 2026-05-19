const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../Pages');
const files = ['students.html'];

const pat = /<div class="friends-list">[\s\S]*?<\/div>\s*<\/div>/;
const rep = '<div class="friends-list" id="rightFriendsList"></div>';

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const orig = content;
    content = content.replace(pat, rep);
    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', file);
    } else {
        console.log('No match:', file);
    }
}
