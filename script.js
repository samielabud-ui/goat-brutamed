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
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const db = getFirestore(app);

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

function getAuthErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Este e-mail ja tem uma conta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Digite um e-mail valido.",
    "auth/missing-password": "Digite sua senha.",
    "auth/operation-not-allowed": "Ative o provedor Email/Password no Firebase Authentication.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  };

  return messages[error?.code] || "Nao foi possivel autenticar. Confira e-mail, senha e configuracao do Firebase.";
}

function getProfileErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Login feito, mas o Firestore bloqueou o perfil. Ajuste as regras para users/{uid}.";
  }

  return "Login feito, mas nao foi possivel salvar/ler seu perfil. Tente novamente em instantes.";
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

async function createUserProfile(userRef, user, fallbackName = "") {
  await setDoc(userRef, {
    uid: user.uid,
    nome: user.displayName || fallbackName || user.email?.split("@")[0] || "Usuario",
    email: user.email || "",
    role: "membro",
    adm: false,
    diretor: false,
    ativo: true,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

async function readUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

async function ensureUserProfile(user, fallbackName = "") {
  const currentUid = auth.currentUser?.uid;

  if (!currentUid || currentUid !== user.uid) {
    throw new Error("Usuario autenticado indisponivel ou divergente.");
  }

  const userRef = doc(db, "users", currentUid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await createUserProfile(userRef, user, fallbackName);
  }

  const updatedSnap = await getDoc(userRef);
  if (!updatedSnap.exists()) {
    throw new Error(`Perfil users/${currentUid} nao foi encontrado apos criacao/leitura.`);
  }

  return updatedSnap.data();
}

async function loadAuthenticatedInterface(user, fallbackName = "") {
  try {
    const profile = await ensureUserProfile(user, fallbackName);
    applyAuthUI(user, profile);
    return profile;
  } catch (error) {
    console.error("Erro ao criar/ler perfil do Firestore em users/{uid}", {
      uid: auth.currentUser?.uid,
      error,
    });
    applyAuthUI(user, { adm: false });
    setAuthStatus(getProfileErrorMessage(error), "error");
    return null;
  }
}

function applyAuthUI(user, profile) {
  const isLoggedIn = Boolean(user);
  const isAdm = profile?.adm === true;
  const role = isAdm ? "Administrador" : "Membro";

  authOpenButtons.forEach((button) => {
    button.textContent = isLoggedIn ? "Minha conta" : "Entrar";
  });

  authUser.hidden = !isLoggedIn;
  adminArea.classList.toggle("is-hidden", !isAdm);
  adminLink.hidden = !isAdm;

  if (isLoggedIn) {
    authUserName.textContent = profile?.nome || user.displayName || user.email;
    authUserRole.textContent = `${role} | users/${user.uid} | adm: ${isAdm}`;
    userDbPath.textContent = `Firestore: users/${user.uid}/adm = ${isAdm}`;
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
      authForm.reset();
      const profile = await loadAuthenticatedInterface(credential.user, name);
      if (profile) {
        setAuthStatus("Conta criada. Perfil salvo com adm: false.", "success");
      }
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      authForm.reset();
      const profile = await loadAuthenticatedInterface(credential.user);
      if (profile) {
        setAuthStatus("Login realizado.", "success");
      }
    }
  } catch (error) {
    setAuthStatus(getAuthErrorMessage(error), "error");
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
    await loadAuthenticatedInterface(user);
  } catch (error) {
    console.error("Erro inesperado no estado de autenticacao", error);
    applyAuthUI(user, { adm: false });
    setAuthStatus(getProfileErrorMessage(error), "error");
  }
});

setAuthMode("login");
