# MedGuide — API (Back-end)

API REST do MedGuide. Gerencia cadastro e autenticação de pacientes e médicos, perfis e endereços, busca de profissionais e agendamentos. O consumidor web está no repositório [medguide_front](https://github.com/PedroHSFreire/medguide_front).

## Tecnologias

- Node.js 18 ou 20, Express 4 e TypeScript.
- SQLite por meio de `sqlite3`.
- JWT para autenticação, bcrypt para hash de senha e `express-validator` para validação de entradas.
- Helmet, CORS e Morgan para middleware HTTP.

## Executar localmente

```bash
npm ci
npm run dev
```

O servidor inicia na porta `8080` (fixada em `src/server.ts`). A rota `GET /api/health` retorna o estado básico da API. Para compilar e iniciar a versão compilada:

```bash
npm run build
npm start
```

O comando `start` executa o build antes de iniciar `dist/server.js`.

## Configuração

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `JWT_SECRET` | Assinatura e verificação dos tokens | obrigatório; segredo aleatório com ao menos 32 caracteres |
| `DATABASE_PATH` | Localização do arquivo SQLite | `database.sqlite` na raiz do repositório |
| `FRONTEND_ORIGIN` | Origem adicional liberada pelo CORS | opcional; `localhost:3000` e `localhost:3001` já são aceitos |

O servidor carrega variáveis de `.env` via `dotenv`. Configure um `JWT_SECRET` aleatório com pelo menos 32 caracteres; a API recusa tokens quando ele está ausente ou curto. Para desenvolvimento, use um banco local isolado ou defina `DATABASE_PATH` para outro arquivo. O `.env` e o SQLite são ignorados pelo Git.

## Endpoints

Todos os endpoints são prefixados por `/api`. Exceto registro, login, recuperação/redefinição de senha e rotas explicitamente públicas, os endpoints exigem `Authorization: Bearer <token>`.

| Grupo | Métodos e caminhos | Descrição |
| --- | --- | --- |
| Saúde | `GET /health` | Estado da API |
| Médicos | `POST /doctor/register`, `POST /doctor/login` | Cadastro e login |
| Médicos | `POST /doctor/forgot-password`, `POST /doctor/reset-password` | Recuperação de senha |
| Médicos | `GET /doctor/profile`, `PUT /doctor/profile` | Perfil do médico autenticado |
| Médicos | `GET /doctor/search`, `GET /doctor/specialties`, `GET /doctor/` | Busca, especialidades e listagem (protegidas) |
| Médicos | `GET/PUT/DELETE /doctor/:id`, `GET /doctor/cpf/:cpf` | Consulta e manutenção por identificador/CPF |
| Endereço médico | `POST/GET/PUT/DELETE /doctor/:id/address` | Endereço associado ao médico |
| Pacientes | `POST /pacient/register`, `POST /pacient/login` | Cadastro e login |
| Pacientes | `POST /pacient/forgot-password`, `POST /pacient/reset-password` | Recuperação de senha |
| Pacientes | `GET /pacient/profile`, `PUT /pacient/profile` | Perfil do paciente autenticado |
| Pacientes | `GET /pacient/:id`, `GET /pacient/cpf/:cpf`, `PUT/DELETE /pacient/:id` | Consulta e manutenção por identificador/CPF |
| Endereço paciente | `POST/GET/PUT/DELETE /pacient/:id/address` | Endereço associado ao paciente |
| Agendamentos | `POST /appointments`, `GET /appointments/:id` | Criar ou consultar agendamento |
| Agendamentos | `GET /appointments/pacient/:patientId`, `GET /appointments/doctor/:doctorId` | Listar por paciente ou médico |
| Agendamentos | `PUT/DELETE /appointments/:id` | Atualizar ou excluir agendamento |
| Prescrições e lembretes | `PUT /appointments/:id` | Médico salva observações clínicas e `prescription_details` (nome, dosagem, horários, início e duração) |
| Confirmação de dose | `GET/POST /appointments/:id/medications/doses` | Participantes consultam registros; somente o paciente vinculado registra `taken: true/false` por horário |

Os IDs de médico, paciente, consulta e registro de dose são UUIDs. O formato comum de resposta inclui `success`, `data` ou `error`; os detalhes variam por endpoint. A listagem do paciente usa `/appointments/pacient/:patientId`, alinhada à grafia usada pelo back-end.

## Persistência e arquitetura

`src/server.ts` carrega ambiente, inicializa as tabelas e inicia o Express. `src/app.ts` registra Helmet, CORS, parsers, rotas e handlers de erro. `src/routes` organiza os grupos de endpoints; controllers validam o fluxo e delegam operações aos models; `src/database/connection.ts` encapsula consultas SQLite.

O banco cria tabelas de médicos, pacientes, seus endereços e consultas. Os vínculos das consultas apontam para médico e paciente. O banco `database.sqlite` é criado localmente quando a API inicializa as tabelas. Ele foi removido da versão atual do repositório porque continha registros de médicos, pacientes e consultas; o arquivo e seus sidecars agora são ignorados pelo Git. Os dados removidos ainda podem estar acessíveis no histórico anterior e devem ser tratados como expostos. Para produção, use armazenamento persistente com backup e controles de acesso.

```text
src/
  app.ts, server.ts       configuração Express e inicialização
  routes/                 rotas de médicos, pacientes e consultas
  controllers/            regras de negócio HTTP
  models/                 operações sobre SQLite
  database/               conexão e inicialização do esquema
  middleware/             JWT, validação e tratamento de erros
  types/                  tipos e DTOs compartilhados
```

## Pontos encontrados na avaliação

- A lista CORS contém `"http://localhost:8080, https://medguide-y0j4.onrender.com"` como uma única origem. Isso não corresponde a nenhuma das duas origens separadas e pode bloquear o front publicado. Configure cada origem permitida como entrada própria e confirme o domínio real do front.
- `JWT_SECRET` é obrigatório e validado com mínimo de 32 caracteres; use um segredo diferente em cada ambiente.
- As rotas de consulta verificam que há um token, mas alguns controllers consultam ou alteram o recurso apenas pelo ID. Revise autorização por proprietário/papel para impedir que um usuário autenticado acesse consultas ou registros de terceiros.
- O banco rastreado anteriormente continha dados pessoais e de saúde. Ele foi retirado da versão atual, mas continua no histórico Git; trate esses dados como potencialmente expostos e use armazenamento apropriado sem versionar registros reais.
- Lembretes de dose são notificações do navegador enquanto a página está aberta; não são push em segundo plano nem alertas por SMS/e-mail.
- Não há suíte de testes configurada. O script `npm test` é apenas um placeholder que termina com erro.

Os pontos acima vêm da leitura estática do código e não constituem auditoria formal de segurança ou privacidade.
