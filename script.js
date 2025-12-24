// ----------------- IMPORTS -----------------
import {
  auth, googleProvider, githubProvider, signInWithPopup, signOut,
  onAuthStateChanged, updateProfile, db, ref, push, set, onValue,
  messaging, getToken, onMessage
} from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { onDisconnect } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { ref as dbRef } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { requestNotificationPermission } from "./firebase.js";
// ----------------- ELEMENTS -----------------
const openLogin = document.getElementById("openLogin");
const loginPopup = document.getElementById("loginPopup");
const closePopup = document.getElementById("closePopup");
const googleLogin = document.getElementById("googleLogin");
const githubLogin = document.getElementById("githubLogin");
const logoutBtn = document.getElementById("logoutBtn");

const profileWrapper = document.getElementById("profileWrapper");
const profileMenu = document.getElementById("profileMenu");
const userDisplay = document.getElementById("userDisplay");
const avatar = document.getElementById("avatar");

const chatSection = document.getElementById("chatSection");
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const groupSelect = document.getElementById("groupSelect");
const newGroupName = document.getElementById("newGroupName");
const createGroupBtn = document.getElementById("createGroupBtn");
const userSelect = document.getElementById("userSelect");
const typingIndicator = document.getElementById("typingIndicator");
const statusText = document.getElementById("statusText");

const profilePopup = document.getElementById("profilePopup");
const closeProfilePopup = document.getElementById("closeProfilePopup");
const editUsername = document.getElementById("editUsername");
const editBio = document.getElementById("editBio");
const editPic = document.getElementById("editPic");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const imageBtn = document.getElementById("imageBtn");
const imageUpload = document.getElementById("imageUpload");

const themeToggle = document.getElementById("themeToggle");

imageBtn.onclick = () => imageUpload.click();

// ----------------- STATE -----------------
let currentUser = null;
let currentGroup = "general";
let currentPrivateChat = null;

// ----------------- HELPERS -----------------
function getPrivateChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function setUserPresence(uid, isOnline) {
  if (!uid) return;
  set(ref(db, `users/${uid}/status`), {
    state: isOnline ? "online" : "offline",
    lastChanged: Date.now()
  });
}

// ----------------- LOGIN -----------------
openLogin.onclick = () => loginPopup.style.display = "flex";
closePopup.onclick = () => loginPopup.style.display = "none";

googleLogin.onclick = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    loginPopup.style.display = "none";
  } catch (err) {
    console.error(err.message);
  }
};

githubLogin.onclick = async () => {
  try {
    await signInWithPopup(auth, githubProvider);
    loginPopup.style.display = "none";
  } catch (err) {
    console.error(err.message);
  }
};

logoutBtn.onclick = async () => {
  if (currentUser) {
    await signOut(auth);
  }
};

// ----------------- PROFILE DROPDOWN -----------------
profileWrapper.addEventListener("click", (e) => {
  e.stopPropagation();
  profileMenu.style.display =
    profileMenu.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", () => {
  profileMenu.style.display = "none";
});

// ----------------- PROFILE POPUP -----------------
const popupTriggers = ["viewProfile", "addBio", "changeUsername", "addProfilePic"];
popupTriggers.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.onclick = () => {
    profileMenu.style.display = "none";
    profilePopup.style.display = "flex";
  };
});

closeProfilePopup.onclick = () => {
  profilePopup.style.display = "none";
};

saveProfileBtn.onclick = async () => {
  if (!currentUser) return;
  if (editUsername.value.trim().length >= 3) {
    await updateProfile(currentUser, { displayName: editUsername.value });
    userDisplay.textContent = editUsername.value;
  }
  if (editBio.value.trim()) set(ref(db, `users/${currentUser.uid}/bio`), editBio.value);
  if (editPic.files.length > 0) {
    const file = editPic.files[0];
    const reader = new FileReader();
    reader.onload = e => {
      avatar.style.backgroundImage = `url(${e.target.result})`;
      avatar.textContent = "";
      set(ref(db, `users/${currentUser.uid}/photoURL`), e.target.result);
    };
    reader.readAsDataURL(file);
  }
  profilePopup.style.display = "none";
};

// ----------------- AUTH STATE -----------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    openLogin.style.display = "none";
    profileWrapper.style.display = "flex";
    chatSection.style.display = "block";
    statusText.textContent = "🟢 Online";

    const name = user.displayName || user.email.split("@")[0];
    userDisplay.textContent = name;
    avatar.style.backgroundImage = user.photoURL ? `url(${user.photoURL})` : "";
    avatar.textContent = user.photoURL ? "" : name[0].toUpperCase();

    // ---- Online presence ----
    const userStatusRef = ref(db, `users/${user.uid}/status`);
    set(userStatusRef, { state: "online", lastChanged: Date.now() });
    onDisconnect(userStatusRef).set({ state: "offline", lastChanged: Date.now() });

    // ---- 🔔 Request FCM permission & save token ----
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await set(ref(db, `users/${user.uid}/fcmToken`), token);
        console.log("Notification token saved!");
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }

    // ---- Load chats ----
    loadUserList();
    loadGroupMessages();

  } else {
    currentUser = null;
    openLogin.style.display = "block";
    profileWrapper.style.display = "none";
    chatSection.style.display = "none";
    statusText.textContent = "🔴 Offline";
  }
});


// ----------------- USER LIST -----------------
function loadUserList() {
  const usersRef = ref(db, "users");
  onValue(usersRef, snapshot => {
    userSelect.innerHTML = `<option value="">-- Select User --</option>`;
    snapshot.forEach(child => {
      const uid = child.key;
      const data = child.val();
      if (currentUser && uid !== currentUser.uid) {
        const opt = document.createElement("option");
        const status = data.status?.state === "online" ? "🟢" : "🔴";
        opt.value = uid;
        opt.textContent = `${status} ${data.displayName || "User"}`;
        userSelect.appendChild(opt);
      }
    });
  });
}

userSelect.addEventListener("change", () => {
  currentPrivateChat = userSelect.value ? getPrivateChatId(currentUser.uid, userSelect.value) : null;
  if (currentPrivateChat) loadPrivateMessages();
  else loadGroupMessages();
});

// ----------------- MESSAGES -----------------
sendBtn.onclick = sendMessage;
msgInput.addEventListener("keypress", e => e.key === "Enter" && sendMessage());

async function sendMessage() {
  if (!currentUser) return;

  const text = msgInput.value.trim();
  const file = imageUpload.files[0];

  if (!text && !file) return; // nothing to send

  let base64Image = "";
  if (file) {
    // Convert image to Base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      base64Image = e.target.result;

      const message = {
  user: currentUser.displayName || currentUser.email.split("@")[0],
  sender: currentUser.uid,
  text,
  image: base64Image || "",
  timestamp: Date.now(),
  readBy: [currentUser.uid], // mark as read by sender
};


      const path = currentPrivateChat
        ? `privateChats/${currentPrivateChat}/messages`
        : `groups/${currentGroup}/messages`;

      const newMsgRef = push(ref(db, path));
      await set(newMsgRef, message);

      msgInput.value = "";
      imageUpload.value = "";
      set(ref(db, `typingStatus/${currentUser.uid}`), { typing: false });
    };
    reader.readAsDataURL(file);
    return; // wait for FileReader
  }

  // If no image, send normal message
  const message = {
    user: currentUser.displayName || currentUser.email.split("@")[0],
    sender: currentUser.uid,
    text,
    image: "",
    timestamp: Date.now(),
  };

  const path = currentPrivateChat
    ? `privateChats/${currentPrivateChat}/messages`
    : `groups/${currentGroup}/messages`;

  const newMsgRef = push(ref(db, path));
  await set(newMsgRef, message);

  msgInput.value = "";
  set(ref(db, `typingStatus/${currentUser.uid}`), { typing: false });
}


function renderMessage(m, id, path) {
  const isSelf = currentUser && m.sender === currentUser.uid;
  const bubble = document.createElement("div");
  bubble.className = "message-bubble" + (isSelf ? " self" : "");

  const readSymbol = m.readBy && m.readBy.length > 1 ? "✓✓" : "✓";

  bubble.innerHTML = `
    <strong>${m.user}</strong><br>
    ${m.text || ""}
    ${m.image ? `<img src="${m.image}" class="message-image">` : ""}
    <div class="message-meta">
      ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      ${isSelf ? readSymbol : ""}
    </div>
  `;

  // 🗑️ Right-click (or long press) to delete your own message
  if (isSelf) {
    bubble.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const confirmDelete = confirm("Delete this message?");
      if (confirmDelete) {
        set(ref(db, `${path}/${id}`), null);
      }
    });
  }
  // ❤️😂👍 REACTIONS
const reactionMenu = document.createElement("div");
reactionMenu.className = "reaction-menu";
reactionMenu.innerHTML = `
  <span>❤️</span>
  <span>😂</span>
  <span>👍</span>
  <span>😮</span>
  <span>😢</span>
`;

reactionMenu.style.display = "none";
bubble.appendChild(reactionMenu);

// Show emoji menu when hovering
bubble.addEventListener("mouseenter", () => {
  reactionMenu.style.display = "block";
});
bubble.addEventListener("mouseleave", () => {
  reactionMenu.style.display = "none";
});

// When an emoji is clicked
reactionMenu.addEventListener("click", (e) => {
  const emoji = e.target.textContent.trim();
  if (!emoji) return;
  const reactionRef = ref(db, `${path}/${id}/reactions/${currentUser.uid}`);
  set(reactionRef, emoji);
});

// Display reactions under message
if (m.reactions) {
  const reactionList = Object.values(m.reactions);
  if (reactionList.length > 0) {
    const reactionDiv = document.createElement("div");
    reactionDiv.className = "reaction-display";
    reactionDiv.textContent = reactionList.join(" ");
    bubble.appendChild(reactionDiv);
  }
}

  messagesDiv.appendChild(bubble);
}

// ----------------- DELETE MESSAGE -----------------
function deleteMessage(path, messageId) {
  if (!confirm("Delete this message for everyone?")) return;
  set(ref(db, `${path}/${messageId}`), null);
}

// ----------------- LOAD MESSAGES -----------------
function loadGroupMessages() {
  const messagesRef = ref(db, `groups/${currentGroup}/messages`);
  onValue(messagesRef, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((child) => {
      const m = child.val();
      const messageId = child.key;  // this is the unique Firebase ID for that message
      const path = `groups/${currentGroup}/messages`;
      
      renderMessage(m, messageId, path);

      // Mark message as read
      if (currentUser) {
        const readBy = Array.isArray(m.readBy) ? m.readBy : [];
        if (!readBy.includes(currentUser.uid)) {
          set(ref(db, `${path}/${messageId}/readBy`), [
            ...readBy,
            currentUser.uid,
          ]);
        }
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

function loadPrivateMessages() {
  const messagesRef = ref(db, `privateChats/${currentPrivateChat}/messages`);
  onValue(messagesRef, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((child) => {
      const m = child.val();
      const messageId = child.key;
      const path = `privateChats/${currentPrivateChat}/messages`;

      renderMessage(m, messageId, path);

      // Mark private message as read
      if (currentUser) {
        const readBy = Array.isArray(m.readBy) ? m.readBy : [];
        if (!readBy.includes(currentUser.uid)) {
          set(ref(db, `${path}/${messageId}/readBy`), [
            ...readBy,
            currentUser.uid,
          ]);
        }
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// ----------------- TYPING STATUS -----------------
const typingRef = ref(db, "typingStatus");

// when the user types
msgInput.addEventListener("input", () => {
  if (!currentUser) return;
  const isTyping = msgInput.value.trim().length > 0;
  set(ref(db, `typingStatus/${currentUser.uid}`), {
    user: currentUser.displayName || currentUser.email.split("@")[0],
    typing: isTyping
  });
});

// listen for typing from others
onValue(typingRef, (snapshot) => {
  const typingUsers = [];
  snapshot.forEach((child) => {
    const data = child.val();
    if (data.typing && child.key !== currentUser?.uid) {
      typingUsers.push(data.user);
    }
  });

  if (typingUsers.length === 0) {
    typingIndicator.textContent = "";
  } else if (typingUsers.length === 1) {
    typingIndicator.textContent = `${typingUsers[0]} is typing...`;
  } else {
    typingIndicator.textContent = `${typingUsers.join(", ")} are typing...`;
  }
});

// ----------------- CREATE NEW GROUP -----------------
createGroupBtn.onclick = async () => {
  const name = newGroupName.value.trim();
  if (!name) return alert("Enter group name");
  await set(ref(db, `groups/${name}`), { createdBy: currentUser.uid, createdAt: Date.now() });
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  groupSelect.appendChild(opt);
  groupSelect.value = name;
  currentGroup = name;
  newGroupName.value = "";
  loadGroupMessages();
};

// ----------------- DARK MODE -----------------
themeToggle.onclick = () => {
  document.body.classList.toggle("dark-mode");
  const mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", mode);
  themeToggle.textContent = mode === "dark" ? "☀️" : "🌙";
};

window.addEventListener("load", () => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  }
});

// ----------------- REALTIME PRESENCE -----------------
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true && currentUser) {
    const statusRef = ref(db, `users/${currentUser.uid}/status`);
    onDisconnect(statusRef).set({ state: "offline", lastChanged: Date.now() });
    setUserPresence(currentUser.uid, true);
  }
});

window.addEventListener("beforeunload", () => {
  if (currentUser) setUserPresence(currentUser.uid, false);
});
let typingTimeout;
msgInput.addEventListener("input", () => {
  if (!currentUser) return;
  clearTimeout(typingTimeout);
  set(ref(db, `typingStatus/${currentUser.uid}`), {
    user: currentUser.displayName || currentUser.email.split("@")[0],
    typing: true
  });
  typingTimeout = setTimeout(() => {
    set(ref(db, `typingStatus/${currentUser.uid}`), { typing: false });
  }, 2000);
});
forgotPassword.onclick = async () => {
  const email = prompt("Enter your registered email:");
  if (!email) return;
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent!");
  } catch (err) {
    alert("Error: " + err.message);
  }
};
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/firebase-messaging-sw.js")
    .then(() => console.log("Service Worker registered"))
    .catch(err => console.error("SW error:", err));
}
