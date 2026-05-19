const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'Pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacements = [
  // Theme toggle: 🌙 Light Mode
  ["'<span>🌙 Light Mode</span>'", "'<span><i data-lucide=\"sun\"></i> Light Mode</span>'"],
  // Nav icons in conversation
  ['<span class="nav-icon">🏠</span>', '<i data-lucide="home" class="nav-icon"></i>'],
  ['<span class="nav-icon">💬</span>', '<i data-lucide="message-circle" class="nav-icon"></i>'],
  ['<span class="nav-icon">🔔</span>', '<i data-lucide="bell" class="nav-icon"></i>'],
  ['<span class="nav-icon">👤</span>', '<i data-lucide="user" class="nav-icon"></i>'],
  // Bottom nav clipboard icon
  ['<span class="nav-item-bottom-icon">📋</span>', '<i data-lucide="layout-list" class="nav-item-bottom-icon"></i>'],
  // Instrument text labels (remove emoji prefix)
  ['>🎹 Piano<', '>Piano<'],
  ['>🎸 Guitar<', '>Guitar<'],
  ['>🎸 Bass<', '>Bass<'],
  ['>🥁 Drums<', '>Drums<'],
  ['>🎹 Synth<', '>Synth<'],
  ['>🎺 Bass<', '>Bass<'],
  ['>🎻 Strings<', '>Strings<'],
  ['>🎹 Pad<', '>Pad<'],
  // Section header emoji prefixes
  ['🎵 AI Jamming - Record', 'AI Jamming - Record'],
  ['🎹 AI Backing Tracks', 'AI Backing Tracks'],
  ['📝 Create Quiz', 'Create Quiz'],
  ['✏️ Edit Your Profile', 'Edit Your Profile'],
  ['📹 Go Live', 'Go Live'],
  ['📹 Live Streams', 'Live Streams'],
  ['💬 Messages', 'Messages'],
  ['🔔 Notifications', 'Notifications'],
  ['🎵 Find Instructors', 'Find Instructors'],
  ['👥 My Students', 'My Students'],
  ['📚 AI Learning', 'AI Learning'],
  ['📝 Bio', 'Bio'],
  ['🎵 Instruments', 'Instruments'],
  ['📹 Camera Preview', 'Camera Preview'],
  // go-live select options
  ['>🎸 Guitar<', '>Guitar<'],
  ['>🎹 Piano<', '>Piano<'],
  ['>🎤 Vocals<', '>Vocals<'],
  ['>🥁 Drums<', '>Drums<'],
  ['>📚 Music Theory<', '>Music Theory<'],
  ['>🎧 Music Production<', '>Music Production<'],
  ['>✨ Other<', '>Other<'],
  // Notification avatar emoji
  ['<div class="notif-avatar">💬</div>', '<div class="notif-avatar"><i data-lucide="message-circle"></i></div>'],
  ['<div class="notif-avatar">📸</div>', '<div class="notif-avatar"><i data-lucide="camera"></i></div>'],
  // go-live friend avatar
  ['<div class="friend-avatar-floating">👤</div>', '<div class="friend-avatar-floating"><i data-lucide="user"></i></div>'],
  // instructors/students empty state avatar
  ['<div style="font-size: 48px; margin-bottom: 8px;">👤</div>', '<div style="margin-bottom: 8px;"><i data-lucide="user" style="width:48px;height:48px;color:#ccc;"></i></div>'],
  // messages user avatar
  ['<div style="font-size: 32px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">👤</div>', '<div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;"><i data-lucide="user" style="width:24px;height:24px;color:#aaa;"></i></div>'],
  // ai-learning empty state
  ['<div style="font-size: 48px; margin-bottom: 12px;">📝</div>', '<div style="margin-bottom: 12px;"><i data-lucide="file-text" style="width:48px;height:48px;color:#ccc;"></i></div>'],
  ['<div style="font-size:36px; margin-bottom:12px;">🗑️</div>', '<div style="margin-bottom:12px;"><i data-lucide="trash-2" style="width:36px;height:36px;color:#ccc;"></i></div>'],
  // profile empty state
  ['<div style="font-size:56px;margin-bottom:12px;">🖼️</div>', '<div style="margin-bottom:12px;"><i data-lucide="image" style="width:56px;height:56px;color:#aaa;"></i></div>'],
  // streaming video placeholder
  ['<div id="videoPlaceholder" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 48px;"> 📹</div>', '<div id="videoPlaceholder" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"><i data-lucide="video" style="width:64px;height:64px;color:#555;"></i></div>'],
  // live-streams placeholder thumbnails
  ['style="display: flex; align-items: center; justify-content: center; font-size: 48px;">🎸</div>', 'style="display: flex; align-items: center; justify-content: center;"><i data-lucide="guitar" style="width:48px;height:48px;color:white;opacity:0.8;"></i></div>'],
  ['style="display: flex; align-items: center; justify-content: center; font-size: 48px;">🎹</div>', 'style="display: flex; align-items: center; justify-content: center;"><i data-lucide="music" style="width:48px;height:48px;color:white;opacity:0.8;"></i></div>'],
  // ai-jamming.html: profile avatar 👤
  ['<div class="profile-avatar-large">👤</div>', '<div class="profile-avatar-large"><i data-lucide="user" style="width:40px;height:40px;color:white;"></i></div>'],
  // go-live.html: profile avatar 👤
  // (handled separately since it appears multiple times in different contexts)
  // ai-jamming record instrument icon spans
  ['<span class="instrument-icon">🎸</span>', '<span class="instrument-icon"><i data-lucide="music"></i></span>'],
  ['<span class="instrument-icon">🥁</span>', '<span class="instrument-icon"><i data-lucide="music-2"></i></span>'],
  ['<span class="instrument-icon">🎺</span>', '<span class="instrument-icon"><i data-lucide="music"></i></span>'],
];

let totalCount = 0;
for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  let fileCount = 0;
  for (const [from, to] of replacements) {
    while (content.includes(from)) {
      content = content.replace(from, to);
      fileCount++;
    }
  }
  if (fileCount > 0) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(file + ': ' + fileCount + ' replacements');
    totalCount += fileCount;
  }
}
console.log('Total: ' + totalCount + ' replacements');
