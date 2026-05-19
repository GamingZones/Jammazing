// API Configuration - Dynamic based on environment
const getApiUrl = () => {
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:3000/api';
  }
  
  // Production - check for injected URL or environment variable
  if (window.__API_URL__) return window.__API_URL__ + '/api';
  if (typeof REACT_APP_API_URL !== 'undefined') return REACT_APP_API_URL + '/api';
  
  // Fallback to current origin
  return window.location.origin + '/api';
};

const API_BASE_URL = getApiUrl();

// Helper function to safely create onclick handlers
function _safeOpenDirectMessage(userId, firstName, lastName, profilePic, username) {
    return `openDirectMessage('${String(userId).replace(/'/g, "\\'")}', '${String(firstName + ' ' + lastName).replace(/'/g, "\\'")}', '${String(profilePic || '').replace(/'/g, "\\'").slice(0, 300)}', '${String(username || '').replace(/'/g, "\\'")}')`;
}

// Apply profile picture to all avatar elements
function _applyProfilePicture(dataUrl) {
    const imgHtml = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Profile">`;
    document.querySelectorAll('.profile-avatar-large').forEach(el => { el.innerHTML = imgHtml; });
    const center = document.getElementById('centerProfileAvatar');
    if (center) center.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;" alt="Profile">`;
    const composer = document.getElementById('composerAvatar');
    if (composer) composer.innerHTML = imgHtml;
}

// Auto-populate sidebars with real data
document.addEventListener('DOMContentLoaded', async () => {
    const currentUserId = localStorage.getItem('userId');

    // Apply profile picture from localStorage immediately (instant, no flicker)
    const picKey = currentUserId ? `profilePicture_${currentUserId}` : null;
    const cachedPic = picKey ? localStorage.getItem(picKey) : null;
    if (cachedPic) _applyProfilePicture(cachedPic);

    // Also fetch from server to get latest (in case changed on another device)
    if (currentUserId) {
        try {
            const r = await fetch(`${API_BASE_URL}/users/${currentUserId}`);
            if (r.ok) {
                const u = await r.json();
                if (u.profilePicture) {
                    localStorage.setItem(picKey, u.profilePicture);
                    _applyProfilePicture(u.profilePicture);
                }
            }
        } catch { /* silent */ }
    }

    // Messages sidebar
    const msgList = document.getElementById('messagesSidebarList');
    if (msgList) {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (response.ok) {
                const users = await response.json();
                const others = users.filter(u => String(u.id) !== String(currentUserId));
                msgList.innerHTML = others.length
                    ? others.map(u => {
                        const avatarHtml = u.profilePicture && typeof u.profilePicture === 'string'
                            ? `<img src="${u.profilePicture}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
                            : `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
                        return `
                        <div class="friend-item-floating" onclick="${_safeOpenDirectMessage(u.id, u.firstName || '', u.lastName || '', u.profilePicture || '', u.username || '')}">
                            ${avatarHtml}
                            <div class="friend-info">
                                <div class="friend-name-floating">${(u.firstName || '') + ' ' + (u.lastName || '')}</div>
                                <div class="friend-status">@${u.username || 'user'}</div>
                            </div>
                        </div>`;
                    }).join('')
                    : '<div style="padding:12px;color:var(--text-secondary);font-size:13px;">No users found.</div>';
            }
        } catch {
            msgList.innerHTML = '<div style="padding:12px;color:var(--text-secondary);font-size:13px;">Could not load users.</div>';
        }
    }

    // Friends sidebar (floating)
    const friendsList = document.getElementById('friendsSidebarList');
    if (friendsList) {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (response.ok) {
                const users = await response.json();
                const others = users.filter(u => String(u.id) !== String(currentUserId));
                friendsList.innerHTML = others.length
                    ? others.map(u => {
                        const avatarHtml = u.profilePicture && typeof u.profilePicture === 'string'
                            ? `<img src="${u.profilePicture}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
                            : `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
                        return `
                        <div class="friend-item-floating" onclick="${_safeOpenDirectMessage(u.id, u.firstName || '', u.lastName || '', u.profilePicture || '', u.username || '')}">
                            ${avatarHtml}
                            <div class="friend-info">
                                <div class="friend-name-floating">${(u.firstName || '') + ' ' + (u.lastName || '')}</div>
                                <div class="friend-status">@${u.username || 'user'}</div>
                            </div>
                        </div>`;
                    }).join('')
                    : '<div style="padding:12px;color:var(--text-secondary);font-size:13px;">No users found.</div>';
            }
        } catch {
            friendsList.innerHTML = '<div style="padding:12px;color:var(--text-secondary);font-size:13px;">Could not load users.</div>';
        }
    }

    // Right sidebar notifications
    const notifList = document.getElementById('sidebarNotifList');
    if (notifList && currentUserId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${currentUserId}`);
            if (response.ok) {
                const notifs = await response.json();
                const recent = notifs.slice(0, 5);
                notifList.innerHTML = recent.length
                    ? recent.map(n => `
                        <div class="notification-item" style="padding:8px;border-bottom:1px solid var(--border-color);">
                            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${n.title}</div>
                            <div style="font-size:12px;color:var(--text-secondary);">${n.message}</div>
                        </div>`).join('')
                    : '<div style="padding:8px;color:var(--text-secondary);font-size:13px;">No notifications.</div>';
            }
        } catch {
            notifList.innerHTML = '<div style="padding:8px;color:var(--text-secondary);font-size:13px;">Could not load.</div>';
        }
    }
});

// Messaging — shared across all pages
let _currentRecipientId = null;

async function openDirectMessage(friendId, friendName, friendPic, friendUsername) {
    _currentRecipientId = friendId;
    const chatTitle = document.getElementById('chatTitle');
    const chatUsername = document.getElementById('chatUsername');
    const chatAvatar = document.getElementById('chatAvatar');
    const modal = document.getElementById('conversationModal');
    const container = document.getElementById('messagesContainer');
    const sidebar = document.getElementById('messagesSidebar');
    if (!modal) return;
    if (chatTitle) chatTitle.textContent = friendName || 'Chat';
    if (chatUsername) chatUsername.textContent = friendUsername ? `@${friendUsername}` : '';
    // Set profile link button
    const chatProfileBtn = document.getElementById('chatProfileBtn');
    if (chatProfileBtn) chatProfileBtn.onclick = () => { window.location.href = `user-profile.html?id=${friendId}`; };
    if (chatAvatar) {
        // Try localStorage first, then passed pic
        const storedPic = localStorage.getItem(`profilePicture_${friendId}`);
        const picSrc = storedPic || friendPic;
        if (picSrc && typeof picSrc === 'string' && picSrc.trim() !== '' && !picSrc.startsWith('data:image/jpeg;bas...')) {
            chatAvatar.innerHTML = `<img src="${picSrc.replace(/"/g, '&quot;')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 64 64\\' width=\\'22\\' height=\\'22\\' fill=\\'none\\'><circle cx=\\'32\\' cy=\\'24\\' r=\\'13\\' fill=\\'rgba(255,255,255,0.85)\\'/><ellipse cx=\\'32\\' cy=\\'54\\' rx=\\'22\\' ry=\\'13\\' fill=\\'rgba(255,255,255,0.85)\\'/></svg>'"/>`;
        } else {
            chatAvatar.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='22' height='22' fill='none'><circle cx='32' cy='24' r='13' fill='rgba(255,255,255,0.85)'/><ellipse cx='32' cy='54' rx='22' ry='13' fill='rgba(255,255,255,0.85)'/></svg>`;
        }
    }
    modal.style.display = 'block';
    if (container) container.innerHTML = '';
    if (sidebar) sidebar.classList.add('collapsed');
    // Load existing messages
    try {
        const currentUserId = localStorage.getItem('userId');
        const res = await fetch(`${API_BASE_URL}/messages/${friendId}?userId=${currentUserId}`);
        if (res.ok) {
            const msgs = await res.json();
            msgs.reverse().forEach(m => {
                let text = m.messageText;
                let replyQuote = null, replyQuoteSender = null;
                const replyMatch = text.match(/^\[reply:(\{.*?\})\] ([\s\S]*)$/);
                if (replyMatch) {
                    try { const r = JSON.parse(replyMatch[1]); replyQuote = r.q; replyQuoteSender = r.s; } catch(e) {}
                    text = replyMatch[2];
                }
                _appendMessage(text, String(m.senderId) === String(currentUserId), m.id, m.createdAt, replyQuote, replyQuoteSender);
            });
            if (container) container.scrollTop = container.scrollHeight;
        }
    } catch (e) { console.error('Load messages error:', e); }
}

let _replyTo = null; // { text, senderName }

function setReply(text, senderName) {
    _replyTo = { text, senderName };
    const bar = document.getElementById('replyPreviewBar');
    const preview = document.getElementById('replyPreviewText');
    if (bar && preview) {
        preview.textContent = `Replying to: "${text.length > 50 ? text.slice(0, 50) + '…' : text}"`;
        bar.style.display = 'flex';
    }
    const input = document.getElementById('messageInput');
    if (input) input.focus();
}

function cancelReply() {
    _replyTo = null;
    const bar = document.getElementById('replyPreviewBar');
    if (bar) bar.style.display = 'none';
}

function _appendMessage(text, isMine, msgId, timestamp, replyQuote, replyQuoteSender) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    // Close any open dropdowns
    document.querySelectorAll('.msg-dropdown').forEach(d => d.remove());

    const isDeleted = text === '__deleted__';

    const msgDate = timestamp ? new Date(typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+') ? timestamp.replace(' ', 'T') + 'Z' : timestamp) : new Date();
    const timeStr = msgDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    // Date/time separator logic — show when day changes OR gap >= 30 minutes
    const lastWrapper = container.querySelector('[data-msg-ts]:last-of-type');
    const lastTs = lastWrapper ? parseInt(lastWrapper.dataset.msgTs) : null;
    const gapMs = lastTs ? (msgDate.getTime() - lastTs) : Infinity;
    const dayChanged = lastTs ? new Date(lastTs).toDateString() !== msgDate.toDateString() : true;

    if (dayChanged || gapMs >= 30 * 60 * 1000) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const dateKey = msgDate.toDateString();
        const dateLabel = dateKey === today ? 'Today' : dateKey === yesterday ? 'Yesterday' : msgDate.toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
        const timeLabel = msgDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        const label = dayChanged ? `${dateLabel} ${timeLabel}` : timeLabel;
        const sep = document.createElement('div');
        sep.style.cssText = 'text-align:center;margin:10px 0 4px;font-size:11px;color:rgba(255,255,255,0.35);display:flex;align-items:center;gap:8px;';
        sep.innerHTML = `<span style="flex:1;height:1px;background:rgba(255,255,255,0.1);"></span><span>${label}</span><span style="flex:1;height:1px;background:rgba(255,255,255,0.1);"></span>`;
        container.appendChild(sep);
    }

    const wrapper = document.createElement('div');
    wrapper.dataset.msgId = msgId || '';
    wrapper.dataset.msgTs = msgDate.getTime();
    wrapper.style.cssText = `display:flex;align-items:flex-end;gap:4px;margin:2px 0;${isMine ? 'flex-direction:row-reverse;' : 'flex-direction:row;'}`;

    if (isDeleted) {
        const tomb = document.createElement('div');
        tomb.style.cssText = `font-size:12px;font-style:italic;color:rgba(255,255,255,0.3);padding:6px 12px;`;
        tomb.textContent = isMine ? '🗑 You deleted a message' : '🗑 This message was deleted';
        wrapper.appendChild(tomb);
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
        return;
    }

    const bubble = document.createElement('div');
    bubble.style.cssText = `padding:8px 12px;border-radius:12px;max-width:72%;font-size:13px;word-break:break-word;position:relative;${isMine ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-bottom-right-radius:4px;' : 'background:rgba(255,255,255,0.1);color:#f0f0f0;border-bottom-left-radius:4px;'}`;

    // Reply quote block
    if (replyQuote) {
        const quoteBlock = document.createElement('div');
        quoteBlock.style.cssText = `border-left:3px solid ${isMine ? 'rgba(255,255,255,0.5)' : '#667eea'};padding:4px 8px;margin-bottom:6px;border-radius:0 6px 6px 0;background:${isMine ? 'rgba(0,0,0,0.2)' : 'rgba(102,126,234,0.15)'};font-size:11px;opacity:0.85;`;
        if (replyQuoteSender) {
            quoteBlock.innerHTML = `<div style="font-weight:600;margin-bottom:2px;color:${isMine ? 'rgba(255,255,255,0.8)' : '#a78bfa'};">${replyQuoteSender}</div>`;
        }
        const quoteText = document.createElement('div');
        quoteText.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;';
        quoteText.textContent = replyQuote.length > 60 ? replyQuote.slice(0, 60) + '…' : replyQuote;
        quoteBlock.appendChild(quoteText);
        bubble.appendChild(quoteBlock);
    }

    const msgText = document.createElement('p');
    msgText.style.cssText = 'margin:0 0 2px 0;';
    msgText.textContent = text;
    bubble.appendChild(msgText);

    const timeEl = document.createElement('span');
    timeEl.style.cssText = 'font-size:10px;opacity:0.6;display:block;text-align:right;';
    timeEl.textContent = timeStr;
    bubble.appendChild(timeEl);

    // Three-dot button
    const dotsBtn = document.createElement('button');
    dotsBtn.innerHTML = '&#8942;';
    dotsBtn.title = 'Options';
    dotsBtn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:18px;padding:0 2px;line-height:1;flex-shrink:0;align-self:center;';
    dotsBtn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.msg-dropdown').forEach(d => d.remove());
        const menu = document.createElement('div');
        menu.className = 'msg-dropdown';
        menu.style.cssText = `position:absolute;${isMine ? 'right:24px;' : 'left:24px;'}bottom:0;background:#2a2a3e;border:1px solid rgba(255,255,255,0.15);border-radius:8px;z-index:9999;min-width:150px;box-shadow:0 4px 16px rgba(0,0,0,0.4);overflow:hidden;`;

        const replyItem = document.createElement('div');
        replyItem.innerHTML = `<span style="font-size:14px;">↩</span> Reply`;
        replyItem.style.cssText = 'padding:9px 14px;cursor:pointer;font-size:13px;color:#f0f0f0;display:flex;align-items:center;gap:8px;';
        replyItem.onmouseenter = () => replyItem.style.background = 'rgba(255,255,255,0.08)';
        replyItem.onmouseleave = () => replyItem.style.background = '';
        replyItem.onclick = () => {
            menu.remove();
            const senderLabel = isMine ? 'You' : (document.getElementById('chatTitle')?.textContent || 'Them');
            setReply(text, senderLabel);
        };

        const deleteItem = document.createElement('div');
        deleteItem.innerHTML = `<span style="font-size:14px;">🗑</span> Delete`;
        deleteItem.style.cssText = 'padding:9px 14px;cursor:pointer;font-size:13px;color:#f87171;display:flex;align-items:center;gap:8px;';
        deleteItem.onmouseenter = () => deleteItem.style.background = 'rgba(248,113,113,0.1)';
        deleteItem.onmouseleave = () => deleteItem.style.background = '';
        deleteItem.onclick = async () => {
            menu.remove();
            const currentUserId = localStorage.getItem('userId');
            let deleteForEveryone = false;
            if (isMine) {
                const choice = confirm('Delete for everyone?\n\nOK = Delete for everyone\nCancel = Delete just for you');
                deleteForEveryone = choice;
            }
            // Show tombstone immediately
            const tomb = document.createElement('div');
            tomb.style.cssText = `font-size:12px;font-style:italic;color:rgba(255,255,255,0.3);padding:6px 12px;${isMine ? 'text-align:right;' : ''}`;
            tomb.textContent = isMine ? '🗑 You deleted a message' : '🗑 This message was deleted';
            wrapper.innerHTML = '';
            wrapper.appendChild(tomb);
            if (msgId) {
                try {
                    await fetch(`${API_BASE_URL}/messages/${msgId}`, {
                        method: 'DELETE',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ userId: currentUserId, deleteForEveryone })
                    });
                } catch(e) { console.error('Delete msg error:', e); }
            }
        };

        menu.appendChild(replyItem);
        menu.appendChild(deleteItem);
        wrapper.style.position = 'relative';
        wrapper.appendChild(menu);
        document.addEventListener('click', () => menu.remove(), { once: true });
    };

    wrapper.appendChild(bubble);
    wrapper.appendChild(dotsBtn);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    let messageText = messageInput.value.trim();
    if (!messageText || !_currentRecipientId) return;
    const senderId = localStorage.getItem('userId');

    // Build final text with reply prefix if replying
    let finalText = messageText;
    let replyQuote = null, replyQuoteSender = null;
    if (_replyTo) {
        replyQuote = _replyTo.text;
        replyQuoteSender = _replyTo.senderName;
        finalText = `[reply:${JSON.stringify({q: replyQuote, s: replyQuoteSender})}] ${messageText}`;
        cancelReply();
    }

    _appendMessage(messageText, true, null, new Date().toISOString(), replyQuote, replyQuoteSender);
    messageInput.value = '';
    try {
        await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, recipientId: _currentRecipientId, messageText: finalText })
        });
    } catch (e) { console.error('Send message error:', e); }
}

function closeConversationModal() {
    const modal = document.getElementById('conversationModal');
    if (modal) modal.style.display = 'none';
    _currentRecipientId = null;
}


async function handleRegister(event) {
    event.preventDefault();
    console.log('handleRegister called');
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const accountType = document.querySelector('input[name="accountType"]:checked')?.value;
    const instrument = document.getElementById('instrument').value;
    
    console.log('Form values:', { firstName, lastName, email, username, accountType, instrument });
    
    // Validation
    if (!firstName || !lastName || !email || !username || !password || !accountType || !instrument) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'danger');
        return;
    }
    
    try {
        const apiUrl = `${API_BASE_URL}/auth/register`;
        console.log('Sending request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                username,
                password,
                accountType,
                instrument
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            showAlert('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            const errorMsg = data.error || 'Registration failed';
            console.error('Registration error:', errorMsg);
            showAlert(errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Error: ' + error.message, 'danger');
    }
}

// Login Handler
async function handleLogin(event) {
    event.preventDefault();
    console.log('handleLogin called');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showAlert('Please enter email and password', 'danger');
        return;
    }
    
    try {
        const apiUrl = `${API_BASE_URL}/auth/login`;
        console.log('Sending login request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('token', data.token);
            localStorage.setItem('accountType', data.accountType);
            localStorage.setItem('userFirstName', data.firstName);
            localStorage.setItem('userLastName', data.lastName);
            localStorage.setItem('userRole', data.accountType === 'instructor' ? 'instructor' : 'student');
            
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            const errorMsg = data.error || 'Login failed';
            console.error('Login error:', errorMsg);
            showAlert(errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Error: ' + error.message, 'danger');
    }
}

// Logout Handler
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('accountType');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

// Delete Account Handler
async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        return;
    }
    
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            localStorage.clear();
            showAlert('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showAlert('Failed to delete account', 'danger');
        }
    } catch (error) {
        console.error('Delete account error:', error);
        showAlert('An error occurred', 'danger');
    }
}

// Create Quiz Handler
async function createQuiz(event) {
    event.preventDefault();
    
    const title = document.getElementById('quizTitle').value;
    const description = document.getElementById('quizDescription')?.value || '';
    const quizType = document.getElementById('quizType').value;
    const difficultyLevel = document.getElementById('difficultyLevel').value;
    const timeLimit = document.getElementById('timeLimit')?.value || null;
    
    const creatorId = localStorage.getItem('userId');
    
    if (!title || !quizType || !difficultyLevel) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                title,
                description,
                creatorId,
                quizType,
                difficultyLevel,
                timeLimit: timeLimit ? parseInt(timeLimit) : null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Quiz created successfully!', 'success');
            document.getElementById('quizForm')?.reset();
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showAlert(data.error || 'Failed to create quiz', 'danger');
        }
    } catch (error) {
        console.error('Create quiz error:', error);
        showAlert('An error occurred', 'danger');
    }
}

// Go Live Handler
async function goLive(event) {
    event.preventDefault();
    
    const title = document.querySelector('input[name="title"]')?.value;
    const description = document.querySelector('textarea[name="description"]')?.value || '';
    const topic = document.querySelector('input[name="topic"]')?.value;
    
    const streamerId = localStorage.getItem('userId');
    
    if (!title || !topic) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/livestreams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                streamerId,
                title,
                description,
                topic
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Going live...', 'success');
            setTimeout(() => {
                window.location.href = 'streaming.html?streamId=' + data.streamId;
            }, 1500);
        } else {
            showAlert(data.error || 'Failed to start stream', 'danger');
        }
    } catch (error) {
        console.error('Go live error:', error);
        showAlert('An error occurred', 'danger');
    }
}

// Load Messages
async function loadMessages(conversationId) {
    if (!conversationId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
        }
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

// Load User Profile
async function loadUserProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            displayUserProfile(user);
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// Load Quizzes
async function loadQuizzes() {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes`);
        const quizzes = await response.json();
        displayQuizzes(quizzes);
    } catch (error) {
        console.error('Load quizzes error:', error);
    }
}

// Load Live Streams
async function loadLiveStreams() {
    try {
        const response = await fetch(`${API_BASE_URL}/livestreams/active`);
        const streams = await response.json();
        displayLiveStreams(streams);
    } catch (error) {
        console.error('Load streams error:', error);
    }
}

// Load Backing Tracks
async function loadBackingTracks() {
    try {
        const response = await fetch(`${API_BASE_URL}/backing-tracks`);
        const tracks = await response.json();
        displayBackingTracks(tracks);
    } catch (error) {
        console.error('Load tracks error:', error);
    }
}

// Load Notifications
async function loadNotifications() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const notifications = await response.json();
            displayNotifications(notifications);
        }
    } catch (error) {
        console.error('Load notifications error:', error);
    }
}

// Alert Handler
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Display Functions (Placeholder - customize as needed)
async function loadProfile() {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        
        if (response.ok) {
            const user = await response.json();
            console.log('Loaded profile:', user);
            displayUserProfile(user);
        } else {
            displayUserProfile({
                firstName: localStorage.getItem('userFirstName') || 'Guest',
                lastName: localStorage.getItem('userLastName') || 'User',
                accountType: localStorage.getItem('userRole') || 'student'
            });
        }
    } catch (error) {
        console.error('Load profile error:', error);
        displayUserProfile({
            firstName: localStorage.getItem('userFirstName') || 'Guest',
            lastName: localStorage.getItem('userLastName') || 'User',
            accountType: localStorage.getItem('userRole') || 'student'
        });
    }
}

// Load Profile for Edit Page
async function loadProfileForEdit() {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        
        if (response.ok) {
            const user = await response.json();
            console.log('Loaded user:', user);
            
            // Populate form fields
            document.getElementById('firstNameInput').value = user.firstName || '';
            document.getElementById('lastNameInput').value = user.lastName || '';
            document.getElementById('bioInput').value = user.bio || '';
            
            // Check instruments if they exist
            if (user.instrument) {
                const instruments = user.instrument.toLowerCase().split(',').map(i => i.trim());
                console.log('Parsed instruments:', instruments);
                document.getElementById('instrumentPiano').checked = instruments.includes('piano');
                document.getElementById('instrumentGuitar').checked = instruments.includes('guitar');
                document.getElementById('instrumentBass').checked = instruments.includes('bass');
                document.getElementById('instrumentDrums').checked = instruments.includes('drums');
            }
        }
    } catch (error) {
        console.error('Load profile for edit error:', error);
    }
}

async function saveProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const firstName = document.getElementById('firstNameInput').value;
    const lastName = document.getElementById('lastNameInput').value;
    const bio = document.getElementById('bioInput').value;
    
    // Get selected instruments
    const selectedInstruments = [];
    if (document.getElementById('instrumentPiano').checked) selectedInstruments.push('piano');
    if (document.getElementById('instrumentGuitar').checked) selectedInstruments.push('guitar');
    if (document.getElementById('instrumentBass').checked) selectedInstruments.push('bass');
    if (document.getElementById('instrumentDrums').checked) selectedInstruments.push('drums');
    const instrument = selectedInstruments.join(', ');
    
    const payload = {
        firstName: firstName || 'User',
        lastName: lastName || 'Profile',
        bio: bio,
        instrument: instrument
    };
    
    console.log('Saving with payload:', payload);
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Save response status:', response.status);
        
        if (response.ok) {
            console.log('Profile saved successfully');
            localStorage.setItem('userFirstName', firstName);
            localStorage.setItem('userLastName', lastName);
            
            // Wait a moment then redirect
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 100);
        } else {
            console.error('Save failed with status:', response.status);
        }
    } catch (error) {
        console.error('Save profile error:', error);
    }
}

function displayUserProfile(user) {
    console.log('Displaying user:', user);
    
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
    }
    if (document.getElementById('profileUserType')) {
        const type = user.accountType ? (user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)) : 'Student';
        document.getElementById('profileUserType').textContent = type;
    }
    if (document.getElementById('profileBio')) {
        const bioText = (user.bio && user.bio.trim()) ? user.bio : 'Not provided yet';
        console.log('Setting bio to:', bioText);
        document.getElementById('profileBio').textContent = bioText;
    }
    if (document.getElementById('profileInstruments')) {
        const instrumentText = (user.instrument && user.instrument.trim()) ? user.instrument.split(',').map(i => { const t = i.trim(); return t.charAt(0).toUpperCase() + t.slice(1); }).join(', ') : 'Not specified yet';
        console.log('Setting instruments to:', instrumentText);
        document.getElementById('profileInstruments').textContent = instrumentText;
    }
}

function displayMessages(messages) {
    console.log('Messages:', messages);
}

function displayQuizzes(quizzes) {
    console.log('Quizzes:', quizzes);
}

// ==================== GOOGLE DRIVE AUDIO FILES ====================

/**
 * Fetch all audio files from Google Drive (organized by category)
 * @returns {Promise<Object>} Audio files organized by category (Piano, Guitar, Drums, etc.)
 */
async function fetchAudioFilesFromDrive() {
    try {
        const response = await fetch(`${API_BASE_URL}/drive/audio`);
        if (!response.ok) throw new Error('Failed to fetch audio files');
        return await response.json();
    } catch (error) {
        console.error('Error fetching audio files from Drive:', error);
        return {};
    }
}

/**
 * Fetch flat list of all audio files
 * @returns {Promise<Array>} Array of all audio file objects
 */
async function fetchAllAudioFilesFromDrive() {
    try {
        const response = await fetch(`${API_BASE_URL}/drive/audio/all`);
        if (!response.ok) throw new Error('Failed to fetch audio files');
        return await response.json();
    } catch (error) {
        console.error('Error fetching all audio files from Drive:', error);
        return [];
    }
}

/**
 * Fetch files from a specific Google Drive folder
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Array>} Array of files in the folder
 */
async function fetchDriveFolderFiles(folderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/drive/folder/${folderId}`);
        if (!response.ok) throw new Error('Failed to fetch folder');
        return await response.json();
    } catch (error) {
        console.error('Error fetching Drive folder:', error);
        return [];
    }
}

function displayLiveStreams(streams) {
    console.log('Streams:', streams);
}

function displayBackingTracks(tracks) {
    console.log('Tracks:', tracks);
}

function displayNotifications(notifications) {
    console.log('Notifications:', notifications);
}

// Check authentication on protected pages
function checkAuth() {
    const userId = localStorage.getItem('userId');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If not logged in and trying to access protected page, redirect to login
    if (!userId) {
        const publicPages = ['login.html', 'register.html', 'index.html', ''];
        if (!publicPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    } else {
        // If logged in and on login/register page, redirect to home
        const loginPages = ['login.html', 'register.html'];
        if (loginPages.includes(currentPage)) {
            window.location.href = 'home.html';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Don't call checkAuth here - let it be called explicitly by pages that need it
});

// Messages and Friends Sidebar Functions
function toggleMessagesSidebar() {
    const sidebar = document.getElementById('messagesSidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function closeMessagesSidebar() {
    const sidebar = document.getElementById('messagesSidebar');
    if (sidebar) {
        sidebar.classList.add('collapsed');
    }
}

function closeFriendsSidebar() {
    const sidebar = document.getElementById('friendsSidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
    }
}

function navigate() {
    // Placeholder navigate function
    console.log('Navigating...');
}
