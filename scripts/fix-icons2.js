const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'Pages');

function replace(content, from, to) {
  let count = 0;
  while (content.includes(from)) {
    content = content.replace(from, to);
    count++;
  }
  return [content, count];
}

function patchFile(filename, patches) {
  const fp = path.join(dir, filename);
  let content = fs.readFileSync(fp, 'utf8');
  let total = 0;
  for (const [from, to] of patches) {
    const [c, n] = replace(content, from, to);
    content = c;
    total += n;
  }
  fs.writeFileSync(fp, content, 'utf8');
  console.log(filename + ': ' + total + ' replacements');
}

// ai-jamming-record.html
patchFile('ai-jamming-record.html', [
  // ✓ checkmarks in instructions - just remove them
  ['✓ Select an instrument', 'Select an instrument'],
  ['✓ Click "Record Note" and play/sing into microphone', 'Click "Record Note" and play/sing into microphone'],
  ['✓ Click "Stop Recording" when done', 'Click "Stop Recording" when done'],
  ['✓ Click Play to hear your recording', 'Click Play to hear your recording'],
  // Instrument buttons (emoji-only in buttons on lines 98-101)
  ['font-size: 24px;">🎹</button>', 'font-size: 14px;">Piano</button>'],
  ['font-size: 24px;">🎸</button>', 'font-size: 14px;">Guitar</button>'],
  ['font-size: 24px;">🥁</button>', 'font-size: 14px;">Drums</button>'],
  ['font-size: 24px;">🎺</button>', 'font-size: 14px;">Trumpet</button>'],
  // Record/Stop/Play buttons top section
  ['font-weight: 600;">🎤 Record Note</button>', 'font-weight: 600;"><i data-lucide="mic"></i> Record Note</button>'],
  ['font-weight: 600;">⏹ Stop Recording</button>', 'font-weight: 600;"><i data-lucide="square"></i> Stop Recording</button>'],
  ['font-weight: 600;">▶ Play</button>', 'font-weight: 600;"><i data-lucide="play"></i> Play</button>'],
  // Main record/stop buttons
  ['>🎤 Record Note</button>', '><i data-lucide="mic"></i> Record Note</button>'],
  ['>⏹ Stop Recording</button>', '><i data-lucide="square"></i> Stop Recording</button>'],
  // Play/Stop/Clear spans in track list
  ['<span>▶</span> Play', '<i data-lucide="play"></i> Play'],
  ['<span>⏹</span> Stop', '<i data-lucide="square"></i> Stop'],
  ['<span>🗑️</span> Clear', '<i data-lucide="trash-2"></i> Clear'],
  // Note tag remove button
  ['onclick="removeNote(\'${note.id}\')">✕</span>', 'onclick="removeNote(\'${note.id}\')"><i data-lucide="x" style="width:12px;height:12px;"></i></span>'],
]);

// ai-jamming.html
patchFile('ai-jamming.html', [
  // Stop/Pause/Play transport buttons
  ['font-size: 18px; background: #dc2626; border: none; color: white; cursor: pointer; transition: all 0.2s;">⏹</button>', 'font-size: 18px; background: #dc2626; border: none; color: white; cursor: pointer; transition: all 0.2s;"><i data-lucide="square" style="width:18px;height:18px;pointer-events:none;"></i></button>'],
  ['font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">⏸</button>', 'font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"><i data-lucide="pause" style="width:18px;height:18px;pointer-events:none;"></i></button>'],
  ['font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">▶</button>', 'font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);"><i data-lucide="play" style="width:16px;height:16px;pointer-events:none;"></i></button>'],
  // Add instrument buttons - replace emoji spans with lucide
  ['data-instrument="synth"><span style="font-size: 18px;">🎹</span>', 'data-instrument="synth"><i data-lucide="music" style="width:18px;height:18px;"></i>'],
  ['data-instrument="guitar"><span style="font-size: 18px;">🎸</span>', 'data-instrument="guitar"><i data-lucide="music" style="width:18px;height:18px;"></i>'],
  ['data-instrument="bass"><span style="font-size: 18px;">🎺</span>', 'data-instrument="bass"><i data-lucide="music" style="width:18px;height:18px;"></i>'],
  ['data-instrument="drums"><span style="font-size: 18px;">🥁</span>', 'data-instrument="drums"><i data-lucide="music-2" style="width:18px;height:18px;"></i>'],
  ['data-instrument="strings"><span style="font-size: 18px;">🎻</span>', 'data-instrument="strings"><i data-lucide="music" style="width:18px;height:18px;"></i>'],
  ['data-instrument="pad"><span style="font-size: 18px;">🎹</span>', 'data-instrument="pad"><i data-lucide="music" style="width:18px;height:18px;"></i>'],
  // JS instrument name strings - strip emoji
  ["{ name: '🎹 Synth'", "{ name: 'Synth'"],
  ["{ name: '🎸 Guitar'", "{ name: 'Guitar'"],
  ["{ name: '🎺 Bass'", "{ name: 'Bass'"],
  ["{ name: '🥁 Drums'", "{ name: 'Drums'"],
  ["{ name: '🎻 Strings'", "{ name: 'Strings'"],
  ["{ name: '🎹 Pad'", "{ name: 'Pad'"],
  // Mute/unmute in track button JS template
  [">${track.muted ? '🔇' : '🔊'}</button>", "><i data-lucide=\"volume-x\" style=\"width:14px;height:14px;display:${track.muted ? 'inline' : 'none'}\"></i><i data-lucide=\"volume-2\" style=\"width:14px;height:14px;display:${track.muted ? 'none' : 'inline'}\"></i></button>"],
]);

// ai-learning.html
patchFile('ai-learning.html', [
  // Quiz card meta spans
  ['>⏱️ ${timeLimit} min</span>', '><i data-lucide="clock" style="width:12px;height:12px;"></i> ${timeLimit} min</span>'],
  ['>📝 ${totalQ} Questions</span>', '><i data-lucide="help-circle" style="width:12px;height:12px;"></i> ${totalQ} Questions</span>'],
  ['>🎵 ${capitalizeFirst(quiz.quizType) || \'General\'}</span>', '><i data-lucide="music" style="width:12px;height:12px;"></i> ${capitalizeFirst(quiz.quizType) || \'General\'}</span>'],
  // Instructor span
  ['>👤 ${creator}</span>', '><i data-lucide="user" style="width:12px;height:12px;"></i> ${creator}</span>'],
  // Delete and Start buttons
  ['onclick="deleteQuiz(${quiz.id}, this)">🗑 Delete</button>', 'onclick="deleteQuiz(${quiz.id}, this)"><i data-lucide="trash-2" style="width:13px;height:13px;"></i> Delete</button>'],
  ['>▶ Start Quiz</button>', '><i data-lucide="play" style="width:13px;height:13px;"></i> Start Quiz</button>'],
]);

// backing-tracks.html
patchFile('backing-tracks.html', [
  // Play button in JS template
  ['font-size: 12px; font-weight: 600;">▶ Play</button>', 'font-size: 12px; font-weight: 600;"><i data-lucide="play" style="width:12px;height:12px;"></i> Play</button>'],
  // Star rating badge
  ['${track.rating || 0}⭐</span>', '${track.rating || 0} <i data-lucide="star" style="width:11px;height:11px;fill:currentColor;"></i></span>'],
]);

// conversation.html  
patchFile('conversation.html', [
  // Back arrow button
  ['margin-right: 8px;" onclick="window.location.href=\'../Pages/messages.html\'">←</button>', 'margin-right: 8px;" onclick="window.location.href=\'../Pages/messages.html\'"><i data-lucide="arrow-left" style="width:16px;height:16px;"></i></button>'],
  // User avatar in header
  ['<div style="font-size: 24px; margin-right: 8px;">👤</div>', '<div style="width:32px;height:32px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:8px;"><i data-lucide="user" style="width:18px;height:18px;color:#888;"></i></div>'],
]);

// create-quiz.html
patchFile('create-quiz.html', [
  // Success message
  ["successMsg.textContent = '✅ Quiz saved successfully! Redirecting...'", "successMsg.textContent = 'Quiz saved successfully! Redirecting...'"],
  // AI Generated Quiz header
  ['>✨ AI Generated Quiz</h4>', '>AI Generated Quiz</h4>'],
]);

// edit-profile.html
patchFile('edit-profile.html', [
  // Save Changes button
  ['onclick="saveProfile()">💾 Save Changes</button>', 'onclick="saveProfile()"><i data-lucide="save"></i> Save Changes</button>'],
]);

// go-live.html
patchFile('go-live.html', [
  // Start Streaming button
  ['font-weight: 600;">🔴 Start Streaming</button>', 'font-weight: 600;"><i data-lucide="radio"></i> Start Streaming</button>'],
  // Notif ❤️
  ['<p class="notif-time">❤️ 1m ago</p>', '<p class="notif-time">1m ago</p>'],
  // Stop Camera / Proceed buttons
  ['font-weight: 600;">❌ Stop Camera</button>', 'font-weight: 600;"><i data-lucide="x-circle"></i> Stop Camera</button>'],
  ['font-weight: 600;">✅ Proceed to Streaming</button>', 'font-weight: 600;"><i data-lucide="check-circle"></i> Proceed to Streaming</button>'],
  // go-live.html has profile-avatar-large 👤 which was supposed to be replaced by previous script
  ['<div class="profile-avatar-large">👤</div>', '<div class="profile-avatar-large"><i data-lucide="user" style="width:40px;height:40px;color:white;"></i></div>'],
]);

// home.html  
patchFile('home.html', [
  // Composer action buttons
  ['onclick="triggerImagePicker()">📷 Photo</button>', 'onclick="triggerImagePicker()"><i data-lucide="camera"></i> Photo</button>'],
  ['onclick="triggerVideoPicker()">🎬 Video</button>', 'onclick="triggerVideoPicker()"><i data-lucide="video"></i> Video</button>'],
  // Delete post button in template literals
  ['title="Delete post">🗑</button>', 'title="Delete post"><i data-lucide="trash-2" style="width:16px;height:16px;pointer-events:none;"></i></button>'],
  // Like icon
  ['<span class="like-icon">♡</span>', '<i data-lucide="heart" class="like-icon" style="width:16px;height:16px;"></i>'],
  // Repost icon
  ['<span class="repost-icon">🔁</span>', '<i data-lucide="repeat-2" class="repost-icon" style="width:16px;height:16px;"></i>'],
  // Comment action
  ['style="cursor:pointer;user-select:none;">💬 <span class="comment-count">', 'style="cursor:pointer;user-select:none;"><i data-lucide="message-circle" style="width:16px;height:16px;"></i> <span class="comment-count">'],
  // Modal comment count
  ['style="display:flex;align-items:center;gap:5px;color:var(--text-secondary);">💬 <span id="modalCommentCount">', 'style="display:flex;align-items:center;gap:5px;color:var(--text-secondary);"><i data-lucide="message-circle" style="width:16px;height:16px;"></i> <span id="modalCommentCount">'],
  // Modal delete
  ['style="cursor:pointer;color:#e0245e;margin-left:auto;">🗑 Delete</span>', 'style="cursor:pointer;color:#e0245e;margin-left:auto;display:flex;align-items:center;gap:4px;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Delete</span>'],
  // Comment like icon
  ['<span class="c-like-icon">♡</span>', '<i data-lucide="heart" class="c-like-icon" style="width:14px;height:14px;"></i>'],
  // JS like toggle textContent → innerHTML
  ["icon.textContent = liked ? '♡' : '❤️';", "icon.setAttribute('data-lucide', liked ? 'heart' : 'heart'); icon.style.fill = liked ? 'none' : 'currentColor'; icon.style.color = liked ? 'inherit' : '#e0245e';"],
  // Repost header
  ['header.innerHTML = `<span>🔁</span>', 'header.innerHTML = `<i data-lucide="repeat-2" style="width:14px;height:14px;"></i>'],
]);

// live-streams.html
patchFile('live-streams.html', [
  // Go Live link
  ['font-weight: 600;">🔴 Go Live</a>', 'font-weight: 600;"><i data-lucide="radio" style="width:14px;height:14px;margin-right:4px;"></i>Go Live</a>'],
  // Viewers count
  ['>👥 234 watching</div>', '><i data-lucide="users" style="width:12px;height:12px;"></i> 234 watching</div>'],
  ['>👥 189 watching</div>', '><i data-lucide="users" style="width:12px;height:12px;"></i> 189 watching</div>'],
  // thumbnail placeholders (lines 92, 101 that are still remaining)
  ['justify-content: center; font-size: 48px;">🎸</div>', 'justify-content: center;"><i data-lucide="music" style="width:48px;height:48px;color:white;opacity:0.8;"></i></div>'],
  ['justify-content: center; font-size: 48px;">🎹</div>', 'justify-content: center;"><i data-lucide="music" style="width:48px;height:48px;color:white;opacity:0.8;"></i></div>'],
]);

// profile.html
patchFile('profile.html', [
  // Camera button
  ['display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);">📷</button>', 'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><i data-lucide="camera" style="width:14px;height:14px;pointer-events:none;"></i></button>'],
  // Delete account button
  ['font-size: 14px; padding: 10px 20px; border-radius: 6px;">❌ Delete Account</button>', 'font-size: 14px; padding: 10px 20px; border-radius: 6px;"><i data-lucide="trash-2"></i> Delete Account</button>'],
  // Edit Profile link
  ["text-decoration: none; margin-top: 16px;\">✏️ Edit Profile</a>", "text-decoration: none; margin-top: 16px;\"><i data-lucide=\"edit-2\"></i> Edit Profile</a>"],
]);

// quiz-interface.html
patchFile('quiz-interface.html', [
  // Quit button
  ['font-size: 12px;">✕ Quit</button>', 'font-size: 12px;"><i data-lucide="x" style="width:12px;height:12px;"></i> Quit</button>'],
  // Next button
  ['font-weight: 600;">Next →</button>', 'font-weight: 600;">Next <i data-lucide="arrow-right" style="width:14px;height:14px;"></i></button>'],
  // JS submit/next text
  ["nextBtn.textContent = 'Submit →';", "nextBtn.innerHTML = 'Submit <i data-lucide=\"arrow-right\" style=\"width:14px;height:14px;\"></i>';"],
  ["nextBtn.textContent = 'Next →';", "nextBtn.innerHTML = 'Next <i data-lucide=\"arrow-right\" style=\"width:14px;height:14px;\"></i>';"],
]);

// streaming.html
patchFile('streaming.html', [
  // Start/Stop/Mute/Cam buttons
  ['font-size: 13px;" onclick="startStream()">🔴 Start</button>', 'font-size: 13px;" onclick="startStream()"><i data-lucide="radio" style="width:13px;height:13px;"></i> Start</button>'],
  ['font-size: 13px;" onclick="stopStream()">⏹ Stop</button>', 'font-size: 13px;" onclick="stopStream()"><i data-lucide="square" style="width:13px;height:13px;"></i> Stop</button>'],
  ['id="muteMicBtn" onclick="toggleMuteMic()">🔊 Mute Mic</button>', 'id="muteMicBtn" onclick="toggleMuteMic()"><i data-lucide="mic" style="width:13px;height:13px;"></i> Mute Mic</button>'],
  ['id="closeCamBtn" onclick="closeCamera()">📷 Close Cam</button>', 'id="closeCamBtn" onclick="closeCamera()"><i data-lucide="camera-off" style="width:13px;height:13px;"></i> Close Cam</button>'],
  // Send chat button
  ['font-size: 12px; font-weight: 600;">→</button>', 'font-size: 12px; font-weight: 600;"><i data-lucide="send" style="width:12px;height:12px;"></i></button>'],
  // JS mute text
  ["document.getElementById('muteMicBtn').textContent = '🔊 Mute Mic';", "document.getElementById('muteMicBtn').innerHTML = '<i data-lucide=\"mic\" style=\"width:13px;height:13px;\"></i> Mute Mic'; lucide.createIcons();"],
  ["document.getElementById('muteMicBtn').textContent = micMuted ? '🔇 Unmute Mic' : '🔊 Mute Mic';", "document.getElementById('muteMicBtn').innerHTML = micMuted ? '<i data-lucide=\"volume-x\" style=\"width:13px;height:13px;\"></i> Unmute Mic' : '<i data-lucide=\"mic\" style=\"width:13px;height:13px;\"></i> Mute Mic'; lucide.createIcons();"],
]);

console.log('All done!');
