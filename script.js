import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth } from "./src/firebase.js";
import { ensureUserProfile, loginUser, logoutUser } from "./src/authService.js";

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const navAnchors = document.querySelectorAll(".nav-links a");
const revealSections = document.querySelectorAll(".section-reveal");
const authPage = document.querySelector("[data-auth-page]");
const authOpenButtons = document.querySelectorAll("[data-auth-open]");
const authForm = document.querySelector("[data-auth-form]");
const authTabs = document.querySelectorAll("[data-auth-mode]");
const nameField = document.querySelector("[data-name-field]");
const authSubmit = document.querySelector("[data-auth-submit]");
const authStatus = document.querySelector("[data-auth-status]");
const authUser = document.querySelector("[data-auth-user]");
const authUserName = document.querySelector("[data-auth-user-name]");
const authUserRole = document.querySelector("[data-auth-user-role]");
const authLogout = document.querySelector("[data-auth-logout]");
const authEmpty = document.querySelector("[data-auth-empty]");
const adminArea = document.querySelector("[data-admin-area]");
const adminLink = document.querySelector("[data-admin-link]");
const userDbPath = document.querySelector("[data-user-db-path]");

let authMode = "login";
let isSubmittingAuth = false;
let hasHandledInitialAuthState = false;
const LOGIN_TIMEOUT_MS = 10000;

function setMenuState(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  navLinks.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

function openAuthPage() {
  window.location.hash = "login";
  authPage?.scrollIntoView({ behavior: "smooth", block: "start" });
  authForm?.querySelector('input[name="email"]')?.focus({ preventScroll: true });
}

function clearAuthStatus() {
  setAuthStatus("");
}

function setAuthStatus(message, type = "info") {
  authStatus.textContent = message;
  authStatus.dataset.type = type;
}

function setAuthLoading(isLoading, message = "") {
  isSubmittingAuth = isLoading;
  authSubmit.disabled = isLoading;
  authSubmit.textContent = isLoading
    ? message || (authMode === "register" ? "Criando conta..." : "Entrando...")
    : authMode === "register"
      ? "Criar conta"
      : "Entrar";
}

function createTimeoutError(message) {
  const error = new Error(message);
  error.code = "timeout";
  return error;
}

function withTimeout(promise, message, timeoutMs = LOGIN_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(createTimeoutError(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function getAuthErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Este e-mail ja tem uma conta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Digite um e-mail valido.",
    "auth/missing-password": "Digite sua senha.",
    "auth/operation-not-allowed": "Ative o provedor Email/Password no Firebase Authentication.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    timeout: "Tempo esgotado ao entrar. Verifique sua conexao e as regras do Firestore.",
  };

  return messages[error?.code] || "Nao foi possivel autenticar. Confira e-mail, senha e configuracao do Firebase.";
}

function setAuthMode(nextMode) {
  if (isSubmittingAuth) {
    return;
  }

  authMode = nextMode;
  const isRegister = authMode === "register";
  nameField.hidden = !isRegister;
  setAuthLoading(false);

  authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authMode === authMode);
  });

  setAuthStatus("");
}

async function loadAuthenticatedInterface(user) {
  try {
    const profile = await ensureUserProfile(user);
    applyAuthUI(user, profile);
    return profile;
  } catch (error) {
    console.error("[PROFILE] Erro ao carregar perfil", {
      uid: auth.currentUser?.uid || user?.uid,
      caminho: user?.uid ? `users/${user.uid}` : "users/{uid}",
      error,
    });
    applyAuthUI(null, null);
    setAuthStatus(error.message || "Login realizado, mas houve erro ao acessar o perfil.", "error");
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
  if (authEmpty) {
    authEmpty.hidden = isLoggedIn;
  }
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
  button.addEventListener("click", (event) => {
    event.preventDefault();
    setMenuState(false);
    openAuthPage();
  });
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
    console.log("[LOGIN] Iniciando login");
    setAuthLoading(true);
    setAuthStatus(authMode === "register" ? "Criando conta..." : "Entrando...");

    if (authMode === "register") {
      const credential = await withTimeout(
        createUserWithEmailAndPassword(auth, email, password),
        "Tempo esgotado ao criar conta. Verifique sua conexao e as regras do Firestore."
      );
      console.log("[LOGIN] Firebase Auth OK:", credential.user.uid);
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }
      authForm.reset();
      const profile = await withTimeout(
        ensureUserProfile(credential.user),
        "Tempo esgotado ao carregar perfil. Verifique sua conexao e as regras do Firestore."
      );
      if (profile) {
        applyAuthUI(credential.user, profile);
        setAuthStatus("Conta criada e perfil carregado.", "success");
      }
    } else {
      const result = await withTimeout(
        loginUser(email, password),
        "Tempo esgotado ao entrar. Verifique sua conexao e as regras do Firestore."
      );
      console.log("[LOGIN] Firebase Auth OK:", result.user.uid);
      authForm.reset();
      applyAuthUI(result.user, result.profile);
      setAuthStatus("Login realizado.", "success");
    }
  } catch (error) {
    console.error("[LOGIN] Erro completo:", error);
    setAuthStatus(error.message || getAuthErrorMessage(error), "error");
  } finally {
    console.log("[LOGIN] Liberando loading");
    setAuthLoading(false);
  }
});

authLogout.addEventListener("click", async () => {
  await logoutUser();
  setAuthStatus("Voce saiu da conta.", "success");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
    clearAuthStatus();
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
  const shouldLoadProfile = !hasHandledInitialAuthState && user;
  hasHandledInitialAuthState = true;

  if (!user) {
    applyAuthUI(null, null);
    return;
  }

  if (isSubmittingAuth || !shouldLoadProfile) {
    return;
  }

  try {
    await loadAuthenticatedInterface(user);
  } catch (error) {
    console.error("Erro inesperado no estado de autenticacao", error);
    applyAuthUI(null, null);
    setAuthStatus(error.message || "Login realizado, mas houve erro ao acessar o perfil.", "error");
  }
});

setAuthMode("login");
