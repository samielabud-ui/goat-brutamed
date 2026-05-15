import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase.js";

export async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  console.log("[PROFILE] UID Auth:", user.uid);
  console.log("[PROFILE] Buscando:", `users/${user.uid}`);

  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    console.log("[PROFILE] Perfil inexistente, criando");
    const profile = {
      uid: user.uid,
      nome: user.displayName || user.email?.split("@")[0] || "Usuario",
      email: user.email || "",
      role: "membro",
      adm: false,
      diretor: false,
      ativo: true,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    await setDoc(userRef, profile, { merge: true });
    console.log("[PROFILE] Perfil criado:", `users/${user.uid}`);
    console.log("[PROFILE] Perfil carregado:", profile);
    return profile;
  }

  const profile = {
    id: snap.id,
    ...snap.data(),
  };
  console.log("[PROFILE] Perfil carregado:", profile);
  return profile;
}

export async function loginUser(email, password) {
  console.log("[LOGIN] Chamando Firebase Authentication");
  const result = await signInWithEmailAndPassword(auth, email, password);
  console.log("[LOGIN] Auth OK. UID:", result.user.uid);
  const profile = await ensureUserProfile(result.user);

  return {
    user: result.user,
    profile,
  };
}

export async function logoutUser() {
  await signOut(auth);
}
