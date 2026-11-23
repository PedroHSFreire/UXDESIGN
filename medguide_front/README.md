# MedGuide — Front-end

Aplicação web do MedGuide para conectar pacientes a profissionais de saúde. Oferece fluxos separados para pacientes e médicos, busca de profissionais e gestão de consultas. A API fica no repositório [Medguide](https://github.com/PedroHSFreire/Medguide).

## Funcionalidades

- Páginas iniciais e de dúvidas.
- Cadastro e login separados para pacientes e médicos.
- Painéis e páginas de perfil para os dois tipos de usuário.
- Busca de médicos e especialidades.
- Criação, consulta e cancelamento de agendamentos.
- Proteção de páginas e gerenciamento de sessão no cliente.

## Tecnologias

- Next.js 16 com App Router e React 19.
- TypeScript, Tailwind CSS 4 e ESLint.
- `fetch`/Axios para comunicação com a API e NextAuth para integração de autenticação.

## Requisitos e execução

Use Node.js compatível com Next.js 16 e npm. O back-end da pasta irmã `Medguide` deve estar iniciado para cadastro, login, consultas e prescrições funcionarem.

```powershell
# Terminal 1 — back-end
cd "C:\Users\psilv\OneDrive\Área de Trabalho\ux\Medguide"
npm ci
npm run dev

# Terminal 2 — front-end
cd "C:\Users\psilv\OneDrive\Área de Trabalho\ux\medguide_front"
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para conferir a versão de produção e as regras de lint:

```bash
npm run build
npm run start
npm run lint
```

`npm run start` serve a compilação existente; execute `npm run build` antes.

## Configuração

O cliente lê as seguintes variáveis de ambiente:

| Variável | Finalidade |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base do back-end, sem o sufixo `/api` (por exemplo, `http://localhost:8080`) |
| `NEXTAUTH_URL` | URL pública da aplicação usada pela configuração de autenticação |
| `NEXTAUTH_SECRET` | Segredo da sessão NextAuth; use valor aleatório e mantenha fora do Git |

Copie `.env.example` para `.env.local`, configure um `NEXTAUTH_SECRET` aleatório e mantenha o arquivo fora do Git. Configure o back-end com o próprio `.env` e `JWT_SECRET`. `DATABASE_URL` não é usado pelo front atual.

## Organização do código

```text
src/app/
  doctor/                 login, cadastro, painel e perfil do médico
  pacient/                login, cadastro, painel e perfil do paciente
  doubts/                 página de dúvidas
  api/auth/[...nextauth]/ integração do NextAuth
  lib/                    autenticação, hooks, serviços e tipos da API
src/components/           componentes e telas compartilhados
public/                   recursos estáticos
```

As páginas vivem no App Router. Os módulos em `src/app/lib/service` concentram chamadas HTTP de autenticação, perfis, busca e consultas; hooks em `src/app/lib/hooks` conectam essas operações às páginas. O estado de autenticação e os componentes de acesso protegido ficam em `lib/auth*`, `useAuth` e `ProtectedRoute`.

## Integração com o back-end

O front chama `${NEXT_PUBLIC_API_URL}/api`. No desenvolvimento, `NEXT_PUBLIC_API_URL=http://localhost:8080`; a API aceita origens `localhost:3000` e `localhost:3001`. Entre os caminhos usados estão:

- `/doctor/register`, `/doctor/login`, `/doctor/profile`, `/doctor/search` e `/doctor/specialties`.
- `/pacient/register`, `/pacient/login` e `/pacient/profile`.
- `/appointments`, `/appointments/pacient/:id`, `/appointments/doctor/:id` e `/appointments/:id`.
- `/appointments/:id/medications/doses` para ler e confirmar doses.

As chamadas autenticadas obtêm o token armazenado no navegador e o enviam como `Authorization: Bearer <token>`. O médico registra observações e medicamentos no atendimento: nome, dosagem, horários diários, início e duração. O paciente vê esse plano na página **Medicamentos** e confirma cada horário com **Tomei** ou **Não tomei**. Notificações usam a API do navegador, pedem autorização por clique e só funcionam enquanto a página permanece aberta.

## Entrega do Bloco 03

Arquitetura, guia de reprodução, cenários/resultados registrados e Design Handoff Package estão em [`docs/entrega-bloco-03.md`](docs/entrega-bloco-03.md). Capturas com dados de demonstração não fazem parte deste repositório público.

## Pontos de atenção

- Há serviços históricos de consultas com contratos parcialmente diferentes; os fluxos ativos de painel usam a listagem `/pacient/:id` e o contrato `success/data`.
- A integração NextAuth e a autenticação própria via token no `localStorage` coexistem no código. Revise qual fluxo é a fonte oficial de sessão antes de ampliar o uso.
- O `.env.local` foi removido da versão atual do Git e passou a ser ignorado, mas continua no histórico anterior. Segredos que já foram publicados precisam ser rotacionados; removê-los em um commit futuro não apaga o histórico.
- Notificações em segundo plano exigem service worker/push e infraestrutura adicional.
