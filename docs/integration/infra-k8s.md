# Handoff da Lambda para o infra-k8s

Este documento é o contrato operacional entre a Lambda de autenticação e o
repositório `oficina-mecanica-infra-k8s`. A Lambda fornece código, bundle,
configuração de execução e acesso ao RDS. O infra-k8s fornece API Gateway,
Kubernetes, NLB e o deploy da API Nest.

## Ownership e exclusões

| Responsabilidade | Repositório |
| --- | --- |
| Lambda, bundle, environment variables e role de execução | `lambda-auth` |
| API Gateway HTTP, stage `$default`, rotas e permissão de invocação | `infra-k8s` |
| Deployment/Service Nest e hostname do NLB | `infra-k8s` |
| RDS, credenciais e backups | repositório de banco |
| Imagem da API Nest | `oficina-mecanica-api` |

Não crie API Gateway, domínio, ACM, Route 53, WAF, VPC Link, NLB ou CloudWatch
Logs neste repositório. Também não copie state ou secrets entre ambientes.

## Configuração da Lambda

1. Garanta que RDS, rede, security groups e a API Nest estejam provisionados.
2. Copie `infra/terraform.tfvars.example` para um arquivo local não versionado.
3. Defina `aws_region`, `environment` (`homologacao` ou `producao`), role de
   execução, subnets privadas, security groups, host do RDS e configurações do
   banco.
4. Defina um `jwt_secret` forte, fora do Git, igual ao segredo usado pela API
   Nest. Nunca registre esse valor em plan, log ou artifact.
5. Execute testes e build e inicialize o root `infra` com o lockfile versionado.
   O pipeline empacota `dist/handler.js` antes da validação Terraform.
6. Gere um plan revisado e aplique somente pelo processo autorizado do ambiente.

O apply cria/atualiza a Lambda e publica o contrato:

```text
/oficina/homologacao/platform/auth-lambda-arn
/oficina/producao/platform/auth-lambda-arn
```

O valor é consumido pelo data source SSM do root correspondente no infra-k8s.
Confirme somente `Name`, `Type` e `Version`; não imprima secrets ou dados de
configuração em logs compartilhados.

## Sequência de integração

Para homologação:

1. Aplique a Lambda com `environment=homologacao`.
2. Faça o deploy Kubernetes da API Nest no mesmo ambiente.
3. Aguarde o Service `LoadBalancer`, migration, rollout e health direto do NLB.
   O deploy do infra-k8s publica
   `/oficina/homologacao/platform/api-nlb-hostname`.
4. Aguarde a consistência eventual do SSM.
5. No infra-k8s, gere e revise o plan de `environments/homologacao`. O root
   lerá os dois contratos; não informe os valores manualmente em `tfvars`.
6. Aplique o saved plan pelo Environment protegido do infra-k8s.
7. Use `api_gateway_endpoint` para testar:

   ```bash
   export ENDPOINT='https://<api-id>.execute-api.<region>.amazonaws.com'
   curl -sS -X POST "$ENDPOINT/auth/cpf" \
     -H 'content-type: application/json' \
     -d '{"cpf":"529.982.247-25"}'
   curl -sS "$ENDPOINT/api/v1/health"
   ```

Produção repete o fluxo com `producao`, branch `main` e aprovações próprias.
Não promova parâmetro SSM manualmente: publique Lambda e Service pelos
workflows dos respectivos ambientes.

### Rollback

Para reverter a aplicação, promova novamente uma versão conhecida do bundle da
Lambda pelo fluxo autorizado e/ou restaure o digest anterior da API Nest por um
novo PR no infra-k8s. Não altere o parâmetro SSM manualmente, não reconstrua uma
imagem sem rastreabilidade e não use `latest`. Revalide os dois contratos e o
endpoint depois da mudança.

## Diagnóstico

- **`auth-lambda-arn` ausente:** o apply da Lambda não terminou ou usou o
  ambiente errado. Corrija a origem; não crie o parâmetro manualmente.
- **`api-nlb-hostname` ausente:** o Service ainda não recebeu hostname ou o
  deploy não conseguiu executar `ssm:PutParameter`. Verifique permissões e
  repita o deploy após o LoadBalancer estar pronto.
- **`POST /auth/cpf` falha:** teste Lambda e RDS separadamente, confirme rede e
  JWT, sem revelar secrets.
- **`/api/v1/health` falha no Gateway:** compare com o health direto do NLB;
  timeout aponta para listener, target ou regra de rede.

O NLB é público e a integração API Gateway → NLB usa HTTP. Esses são riscos
conhecidos desta versão e devem entrar na avaliação de segurança e no plano de
evolução para integração privada com TLS.

## Validação local e CI

```bash
npm ci
npm test
npm run build
npm run test:integration
terraform -chdir=infra fmt -check -recursive
terraform -chdir=infra init -backend=false
terraform -chdir=infra validate
bash tests/terraform-ownership.sh
```

Para validação, use mocks, `init -backend=false` e os gates dos dois
repositórios. Não execute `apply`, `destroy` ou deploy real como parte do teste
local.
