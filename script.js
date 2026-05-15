import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  get,
  getDatabase,
  ref,
  serverTimestamp,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDKE-sdCEw60UlPQqLvMjrHGl6KSG6nUCg",
  authDomain: "brutafrequencia.firebaseapp.com",
  databaseURL: "https://brutafrequencia-default-rtdb.firebaseio.com",
  projectId: "brutafrequencia",
  storageBucket: "brutafrequencia.firebasestorage.app",
  messagingSenderId: "324840070453",
  appId: "1:324840070453:web:a8f6309a5dfa2e959e007c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const navAnchors = document.querySelectorAll(".nav-links a");
const revealSections = document.querySelectorAll(".section-reveal");
const authModal = document.querySelector("[data-auth-modal]");
const authOpenButtons = document.querySelectorAll("[data-auth-open]");
const authClose = document.querySelector("[data-auth-close]");
const authForm = document.querySelector("[data-auth-form]");
const authTabs = document.querySelectorAll("[data-auth-mode]");
const nameField = document.querySelector("[data-name-field]");
const authSubmit = document.querySelector("[data-auth-submit]");
const authStatus = document.querySelector("[data-auth-status]");
const authUser = document.querySelector("[data-auth-user]");
const authUserName = document.querySelector("[data-auth-user-name]");
const authUserRole = document.querySelector("[data-auth-user-role]");
const authLogout = document.querySelector("[data-auth-logout]");
const adminArea = document.querySelector("[data-admin-area]");
const adminLink = document.querySelector("[data-admin-link]");
const userDbPath = document.querySelector("[data-user-db-path]");

let authMode = "login";

function setMenuState(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  navLinks.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

function openAuthModal() {
  authModal.hidden = false;
  document.body.classList.add("menu-open");
}

function closeAuthModal() {
  authModal.hidden = true;
  document.body.classList.remove("menu-open");
  setAuthStatus("");
}

function setAuthStatus(message, type = "info") {
  authStatus.textContent = message;
  authStatus.dataset.type = type;
}

function setAuthMode(nextMode) {
  authMode = nextMode;
  const isRegister = authMode === "register";
  nameField.hidden = !isRegister;
  authSubmit.textContent = isRegister ? "Criar conta" : "Entrar";

  authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authMode === authMode);
  });

  setAuthStatus("");
}

async function ensureUserProfile(user, extraData = {}) {
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    const profile = {
      uid: user.uid,
      name: user.displayName || extraData.name || "",
      email: user.email || "",
      role: "membro",
      isAdmin: false,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await set(userRef, profile);
    return profile;
  }

  await update(userRef, {
    lastLoginAt: serverTimestamp(),
    email: user.email || snapshot.val().email || "",
  });

  return snapshot.val();
}

function applyAuthUI(user, profile) {
  const isLoggedIn = Boolean(user);
  const isAdmin = Boolean(profile?.isAdmin);
  const role = isAdmin ? "Administrador" : "Membro";

  authOpenButtons.forEach((button) => {
    button.textContent = isLoggedIn ? "Minha conta" : "Entrar";
  });

  authUser.hidden = !isLoggedIn;
  adminArea.classList.toggle("is-hidden", !isAdmin);
  adminLink.hidden = !isAdmin;

  if (isLoggedIn) {
    authUserName.textContent = user.displayName || profile?.name || user.email;
    authUserRole.textContent = `${role} | users/${user.uid} | isAdmin: ${isAdmin}`;
    userDbPath.textContent = `Realtime Database: users/${user.uid}/isAdmin = ${isAdmin}`;
  } else {
    authUserName.textContent = "";
    authUserRole.textContent = "";
    userDbPath.textContent = "Entre para ver o caminho do seu usuario no Firebase.";
  }
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

navAnchors.forEach((anchor) => {
  anchor.addEventListener("click", () => setMenuState(false));
});

authOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMenuState(false);
    openAuthModal();
  });
});

authClose.addEventListener("click", closeAuthModal);

authModal.addEventListener("click", (event) => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode));
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    authSubmit.disabled = true;
    setAuthStatus(authMode === "register" ? "Criando conta..." : "Entrando...");

    if (authMode === "register") {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }
      await ensureUserProfile(credential.user, { name });
      setAuthStatus("Conta criada. Perfil salvo com isAdmin: false.", "success");
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(credential.user);
      setAuthStatus("Login realizado.", "success");
    }

    authForm.reset();
  } catch (error) {
    const readableMessage = error?.code
      ? error.code.replace("auth/", "").replaceAll("-", " ")
      : "Nao foi possivel autenticar.";
    setAuthStatus(`Erro: ${readableMessage}`, "error");
  } finally {
    authSubmit.disabled = false;
  }
});

authLogout.addEventListener("click", async () => {
  await signOut(auth);
  setAuthStatus("Voce saiu da conta.", "success");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
    closeAuthModal();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealSections.forEach((section) => revealObserver.observe(section));

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    applyAuthUI(null, null);
    return;
  }

  try {
    const profile = await ensureUserProfile(user);
    applyAuthUI(user, profile);
  } catch (error) {
    applyAuthUI(user, { isAdmin: false });
    setAuthStatus("Login ativo, mas nao foi possivel ler o perfil no banco.", "error");
  }
});

setAuthMode("login");
