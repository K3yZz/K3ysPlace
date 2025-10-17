(() => {
      const messagesEl = document.getElementById('messages');
      const fullIdDisplay = document.getElementById('fullIdDisplay');
      const modalBack = document.getElementById('modalBack');
      const openSettings = document.getElementById('openSettings');
      const closeSettings = document.getElementById('closeSettings');
      const copyFullBtn = document.getElementById('copyFull');
      const nameInput = document.getElementById('nameInput');
      const setNameBtn = document.getElementById('setNameBtn');
      const clearNameBtn = document.getElementById('clearNameBtn');
      const connectInput = document.getElementById('connectInput');
      const connectBtn = document.getElementById('connectBtn');
      const inputEl = document.getElementById('input');
      const sendBtn = document.getElementById('send');
      const typingStatus = document.getElementById('typingStatus');
      const onlineCountEl = document.getElementById('onlineCount');
      const userListEl = document.getElementById('userList');

      if (!messagesEl || !fullIdDisplay || !connectBtn || !connectInput || !userListEl) {
        console.error('chat.js: Required DOM elements missing. Check index.html IDs.');
        return;
      }

      let myPeer, myId = '';
      let connections = {};
      let friends = {};
      try { friends = JSON.parse(localStorage.getItem('friends') || '{}') || {}; } catch (e) { friends = {}; }
      let hasName = !!localStorage.username;
      let ready = false;

      function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c])); }
      function mkEl(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
      function appendNode(node) { messagesEl.appendChild(node); messagesEl.scrollTop = messagesEl.scrollHeight; }
      function systemMsg(text) { console.log('[SYSTEM]', text); const n = mkEl('div', 'msg system'); n.textContent = text; appendNode(n); }
      function dbg(...args) { console.log('[DBG]', ...args); }
      function fmtTime(ts) { return new Date(ts).toLocaleString(); }
      function saveFriends() { try { localStorage.setItem('friends', JSON.stringify(friends)); } catch (e) { console.error('saveFriends failed', e); } }

      function setReady(r) {
        ready = r;
        if (connectBtn) connectBtn.disabled = !r;
        if (copyFullBtn) copyFullBtn.disabled = !r;
        if (!r) systemMsg('Waiting for Peer connection...');
      }

      function renderUsers() {
        userListEl.innerHTML = '';
        let online = 0;
        const ids = Object.keys(friends);
        if (ids.length === 0) {
          const no = mkEl('div', 'small'); no.textContent = 'No friends yet — add one with their full ID.';
          userListEl.appendChild(no);
        }
        const frag = document.createDocumentFragment();
        ids.forEach(id => {
          const info = connections[id] || {};
          const displayName = friends[id]?.name || info.name || id;
          const row = mkEl('div', 'user');
          const left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center';
          const dot = mkEl('span', 'status-dot ' + (info.online ? 'status-online' : 'status-offline'));
          left.appendChild(dot);
          const nm = mkEl('strong'); nm.textContent = displayName; nm.style.color = 'var(--accent)'; nm.style.marginRight = '8px'; nm.style.cursor = 'pointer';
          nm.title = id;
          nm.addEventListener('click', async (e) => { e.stopPropagation(); try { if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(id); else { const ta = document.createElement('textarea'); ta.value = id; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } systemMsg('Copied ID: ' + id); } catch (err) { systemMsg('Copy failed'); console.error(err); } });
          left.appendChild(nm);
          row.appendChild(left);


          const right = document.createElement('div');
          const chatBtn = mkEl('button', 'friendBtn'); chatBtn.textContent = 'Chat'; chatBtn.style.backgroundColor = 'var(--color-accent)';
          chatBtn.addEventListener('click', e => { e.stopPropagation(); startChatWith(id); });
          right.appendChild(chatBtn);
          const remBtn = mkEl('button', 'copyBtn'); remBtn.textContent = 'Remove'; remBtn.style.backgroundColor = 'var(--color-accent)';
          remBtn.addEventListener('click', e => { e.stopPropagation(); removeFriend(id); });
          right.appendChild(remBtn);
          row.appendChild(right);


          frag.appendChild(row);
          if (info.online) online++;
        });
        userListEl.appendChild(frag);
        if (onlineCountEl) onlineCountEl.textContent = online + ' online';
      }

      function startChatWith(peerId) {
        messagesEl.innerHTML = '';
        if (!connections[peerId] || !connections[peerId].online) {
          systemMsg('Attempting to connect to ' + peerId);
          outboundConnect(peerId, true);
        } else {
          systemMsg('Connected to ' + (friends[peerId]?.name || connections[peerId].name || peerId));
        }
        inputEl.disabled = !hasName;
        if (hasName) inputEl.placeholder = 'Type message…';
      }

      function removeFriend(peerId) {
        delete friends[peerId];
        saveFriends();
        if (connections[peerId] && connections[peerId].conn) {
          try { connections[peerId].conn.close(); } catch (e) { }
          delete connections[peerId];
        }
        renderUsers();
        systemMsg('Removed friend: ' + peerId);
      }

      const savedId = localStorage.getItem('peerId') || undefined;
      try { myPeer = new Peer(savedId); } catch (e) { systemMsg('Peer init failed'); console.error(e); return; }

      myPeer.on('open', id => {
        myId = id;
        try { localStorage.setItem('peerId', id); } catch (e) { }
        fullIdDisplay.textContent = id;
        systemMsg('Peer ready: ' + id);
        setReady(true);
        Object.keys(friends).forEach(fid => outboundConnect(fid, false));
        if (localStorage.username) {
          hasName = true;
          if (inputEl) { inputEl.disabled = false; inputEl.placeholder = 'Type message…'; }
        }
      });

      myPeer.on('error', err => {
        systemMsg('Peer error: ' + (err && err.message ? err.message : err));
        console.error(err);
        setReady(false);
      });

      setReady(false);

      if (openSettings) openSettings.addEventListener('click', () => {
        if (!modalBack || !fullIdDisplay) { systemMsg('Settings not available'); return; }
        fullIdDisplay.textContent = myId || 'Loading...';
        nameInput.value = localStorage.username || '';
        modalBack.style.display = 'flex';
      });
      if (closeSettings) closeSettings.addEventListener('click', () => { if (modalBack) modalBack.style.display = 'none'; });

      if (copyFullBtn) copyFullBtn.addEventListener('click', async () => {
        if (!myId) return systemMsg('ID not ready');
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(myId);
          else { const ta = document.createElement('textarea'); ta.value = myId; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
          systemMsg('ID copied to clipboard');
        } catch (e) { systemMsg('Copy failed'); console.error(e); }
      });

      function outboundConnect(peerId, sendFriendRequest = true) {
        if (!peerId) return;
        if (!ready) { systemMsg('Peer not ready — try again in a moment'); return; }
        if (connections[peerId] && connections[peerId].conn && connections[peerId].conn.open) {
          systemMsg('Already connected to ' + peerId);
          return;
        }

        let conn;
        try { conn = myPeer.connect(peerId); } catch (e) { systemMsg('connect() failed'); console.error(e); return; }

        conn.on('data', data => handleData(data, conn.peer));
        conn.on('error', err => { systemMsg('Connection error to ' + peerId); console.error(err); if (connections[peerId]) connections[peerId].online = false; renderUsers(); });
        conn.on('open', () => {
          connections[peerId] = connections[peerId] || {};
          connections[peerId].conn = conn;
          connections[peerId].online = true;
          if (!friends[peerId]) { friends[peerId] = { name: peerId }; saveFriends(); }
          if (localStorage.username) {
            try { conn.send({ type: 'setName', name: localStorage.username }); } catch (e) { }
          }
          if (sendFriendRequest) {
            try { conn.send({ type: 'friendRequest', fromId: myId, fromName: localStorage.username || 'Unknown' }); systemMsg('Friend request sent to ' + peerId); } catch (e) { systemMsg('Failed sending friend request'); }
          }
          renderUsers();
        });
        conn.on('close', () => { if (connections[peerId]) connections[peerId].online = false; renderUsers(); });

        return conn;
      }

      myPeer.on('connection', conn => {
        dbg('incoming from', conn.peer);
        conn.on('data', data => handleData(data, conn.peer));
        conn.on('open', () => {
          connections[conn.peer] = connections[conn.peer] || {};
          connections[conn.peer].conn = conn;
          connections[conn.peer].online = true;
          if (!friends[conn.peer]) { friends[conn.peer] = { name: conn.peer }; saveFriends(); systemMsg('Added incoming friend ' + conn.peer); }
          if (localStorage.username) {
            try { conn.send({ type: 'setName', name: localStorage.username }); } catch (e) { }
          }
          renderUsers();
        });
        conn.on('close', () => { if (connections[conn.peer]) connections[conn.peer].online = false; renderUsers(); });
        conn.on('error', err => console.error('incoming conn error', err));
      });

      function handleData(data, from) {
        if (!data || !data.type) return;
        dbg('handleData', from, data);
        switch (data.type) {
          case 'friendRequest':
            systemMsg(`${data.fromName || from} (${from}) wants to be your friend`);
            setTimeout(() => {
              const ok = confirm(`${data.fromName || from} wants to be friends. Accept?`);
              if (ok) {
                friends[from] = friends[from] || { name: data.fromName || from };
                saveFriends();
                if (!connections[from] || !connections[from].online) {
                  const back = outboundConnect(from, false);
                  if (back) {
                    back.on('open', () => { try { back.send({ type: 'setName', name: localStorage.username || 'Unknown' }); } catch (e) { } });
                  }
                }
                if (connections[from] && connections[from].conn && connections[from].conn.open) {
                  try { connections[from].conn.send({ type: 'friendRequestAccepted', fromId: myId, fromName: localStorage.username || '' }); } catch (e) { }
                }
                systemMsg('Accepted friend request from ' + from);
                renderUsers();
              } else {
                systemMsg('Declined friend request from ' + from);
              }
            }, 50);
            break;

          case 'friendRequestAccepted':
            systemMsg(`${data.fromName || from} accepted your friend request`);
            friends[from] = friends[from] || { name: data.fromName || from };
            saveFriends();
            connections[from] = connections[from] || {};
            connections[from].name = data.fromName || connections[from].name || from;
            connections[from].online = true;
            renderUsers();
            break;

          case 'setName':
            connections[from] = connections[from] || {};
            connections[from].name = data.name;
            connections[from].online = true;
            if (friends[from]) { friends[from].name = data.name; saveFriends(); }
            renderUsers();
            break;

          case 'message':
            {
              const fromName = data.fromName || connections[from]?.name || friends[from]?.name || from;
              const node = mkEl('div', 'msg');
              const strong = mkEl('strong'); strong.textContent = fromName;
              node.appendChild(strong);
              node.appendChild(document.createTextNode(': ' + data.text + ' '));
              const span = mkEl('span', 'timestamp'); span.textContent = fmtTime(data.timestamp);
              node.appendChild(span);
              appendNode(node);
            }
            break;

          case 'typing':
            connections[from] = connections[from] || {};
            connections[from].typing = !!data.isTyping;
            renderUsers();
            updateTypingAggregate();
            break;

          case 'presence':
            connections[from] = connections[from] || {};
            connections[from].online = data.status === 'online';
            renderUsers();
            break;

          case 'ping':
            if (connections[from] && connections[from].conn && connections[from].conn.open) {
              try { connections[from].conn.send({ type: 'pong' }); } catch (e) { }
            }
            break;

          case 'pong':
            connections[from] = connections[from] || {};
            connections[from].online = true;
            renderUsers();
            break;

          default:
            dbg('unknown data', data);
        }
      }

      connectBtn.addEventListener('click', () => {
        const val = connectInput.value.trim();
        if (!val) return;
        if (val === myId) { systemMsg("Can't add yourself"); connectInput.value = ''; return; }
        connectInput.value = '';
        if (!friends[val]) { friends[val] = { name: val }; saveFriends(); renderUsers(); }
        outboundConnect(val, true);
      });

      function sendMessage() {
        if (!localStorage.username) { alert('Set display name in Settings first'); return; }
        const text = inputEl.value.trim();
        if (!text) return;
        inputEl.value = '';
        const payload = { type: 'message', text, fromName: localStorage.username, timestamp: Date.now() };
        let sent = 0;
        for (const id in connections) {
          try { if (connections[id].conn && connections[id].conn.open) { connections[id].conn.send(payload); sent++; } } catch (e) { }
        }
        const node = mkEl('div', 'msg own');
        const strong = mkEl('strong'); strong.textContent = localStorage.username;
        node.appendChild(strong);
        node.appendChild(document.createTextNode(': ' + text + ' '));
        const ts = mkEl('span', 'timestamp'); ts.textContent = fmtTime(payload.timestamp);
        node.appendChild(ts);
        appendNode(node);
        if (sent === 0) systemMsg('No connected friends to send to.');
      }
      if (sendBtn) sendBtn.addEventListener('click', sendMessage);
      if (inputEl) inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

      let typingTimer = null, isTyping = false;
      if (inputEl) inputEl.addEventListener('input', () => {
        if (!localStorage.username) return;
        if (!isTyping) { isTyping = true; broadcastTyping(true); }
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => { isTyping = false; broadcastTyping(false); }, 800);
      });
      if (setNameBtn) setNameBtn.addEventListener('click', () => {
        const v = (nameInput && nameInput.value || '').trim();
        if (v) { localStorage.username = v; hasName = true; if (inputEl) inputEl.disabled = false; }
        renderUsers(); if (modalBack) modalBack.style.display = 'none';
      });
      if (clearNameBtn) clearNameBtn.addEventListener('click', () => {
        delete localStorage.username; hasName = false; if (input) input.disabled = true; renderUsers();
      });
      function broadcastTyping(flag) {
        for (const id in connections) {
          try { if (connections[id].conn && connections[id].conn.open) connections[id].conn.send({ type: 'typing', isTyping: !!flag }); } catch (e) { }
        }
      }
      function updateTypingAggregate() {
        const names = [];
        for (const id in connections) if (connections[id].typing && (friends[id]?.name || connections[id].name)) names.push(friends[id]?.name || connections[id].name);
        typingStatus.textContent = names.length === 0 ? '' : (names.length === 1 ? names[0] + ' is typing…' : names.join(', ') + ' are typing…');
      }

      window.addEventListener('beforeunload', () => { for (const id in connections) try { if (connections[id].conn && connections[id].conn.open) connections[id].conn.send({ type: 'presence', status: 'offline' }); } catch (e) { } });
      setInterval(() => { for (const id in connections) try { if (connections[id].conn && connections[id].conn.open) connections[id].conn.send({ type: 'ping' }); } catch (e) { } }, 15000);

      renderUsers();
      systemMsg('Ready (waiting for Peer to open)...');
      dbg('startup friends', friends);
      window._chatDebug = { connections, friends, outboundConnect, renderUsers };
    })();