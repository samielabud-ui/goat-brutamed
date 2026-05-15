# GOAT | BrutaMed

Primeira versão visual da plataforma institucional e operacional da Atlética BrutaMed.

## Estrutura

- `index.html`: página pública com todas as seções navegáveis.
- `styles.css`: identidade visual, responsividade e animações.
- `script.js`: menu mobile, estados da interface e integração com os serviços de autenticação.
- `src/firebase.js`: configuração Firebase, Auth e Firestore.
- `src/authService.js`: login, logout e criação/leitura do perfil em `users/{uid}`.

## Deploy no Netlify

Use a pasta `goat-brutamed` como raiz do deploy. Não há comando de build nesta versão.

## Firebase

O site usa Firebase Auth por e-mail/senha e Firestore.

No Firebase Console, ative:

- Authentication > Sign-in method > Email/Password.
- Authentication > Settings > Authorized domains: inclua o dominio do Netlify quando publicar.

Ao entrar com uma conta, o app busca ou cria automaticamente o perfil em:

```txt
users/{uid}
```

O ID do documento precisa ser exatamente o UID do Firebase Auth. Campos principais:

```json
{
  "uid": "id-do-usuario",
  "nome": "Nome",
  "email": "email@exemplo.com",
  "role": "membro",
  "adm": false,
  "diretor": false,
  "ativo": true,
  "criadoEm": "serverTimestamp()",
  "atualizadoEm": "serverTimestamp()"
}
```

Para virar ADM:

1. Entre/cadastre-se no site.
2. Abra o Firebase Console do projeto `brutafrequencia`.
3. Va em Firestore Database.
4. Acesse `users/{seuUid}`.
5. Altere `adm` de `false` para `true`.
6. Recarregue o site ou entre novamente.

Nao deixei o front-end mudar `adm` para `true` sozinho, porque isso permitiria que qualquer pessoa virasse administradora.

Regras minimas sugeridas para o Firestore nesta fase:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, create, update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Essas regras sao para desenvolvimento. Elas deixam o usuario criar/ler o proprio perfil em `users/{uid}`.

## Próximas etapas previstas

- Regras de seguranca completas do Firestore.
- Permissoes avancadas para membro, diretor e administrador.
- Painel ADM funcional para controlar usuarios, loja, eventos, modalidades e configuracoes.
