# GOAT | BrutaMed

Primeira versão visual da plataforma institucional e operacional da Atlética BrutaMed.

## Estrutura

- `index.html`: página pública com todas as seções navegáveis.
- `styles.css`: identidade visual, responsividade e animações.
- `script.js`: menu mobile, login Firebase Auth, perfil no Realtime Database e liberacao visual da aba ADM.

## Deploy no Netlify

Use a pasta `goat-brutamed` como raiz do deploy. Não há comando de build nesta versão.

## Firebase

O site usa Firebase Auth por e-mail/senha e Realtime Database.

No Firebase Console, ative:

- Authentication > Sign-in method > Email/Password.
- Authentication > Settings > Authorized domains: inclua o dominio do Netlify quando publicar.

Ao criar ou entrar com uma conta, o app cria/atualiza:

```txt
users/{uid}
```

Campos principais:

```json
{
  "uid": "id-do-usuario",
  "name": "Nome",
  "email": "email@exemplo.com",
  "role": "membro",
  "adm": false
}
```

Para virar ADM:

1. Entre/cadastre-se no site.
2. Abra o Firebase Console do projeto `brutafrequencia`.
3. Va em Realtime Database.
4. Acesse `users/{seuUid}`.
5. Altere `adm` de `false` para `true`.
6. Recarregue o site ou entre novamente.

Nao deixei o front-end mudar `adm` para `true` sozinho, porque isso permitiria que qualquer pessoa virasse administradora.

Regras minimas sugeridas para o Realtime Database nesta fase:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid && newData.child('uid').val() === auth.uid && (newData.child('adm').val() === false || newData.child('adm').val() === data.child('adm').val())"
      }
    }
  }
}
```

Essas regras deixam o usuario criar/atualizar o proprio perfil, mas nao deixam ele se promover para `adm: true` pelo site.

## Próximas etapas previstas

- Regras de seguranca completas do Realtime Database.
- Permissoes avancadas para membro, diretor e administrador.
- Painel ADM funcional para controlar usuarios, loja, eventos, modalidades e configuracoes.
