# Handoff da Lambda para o infra-k8s

A Lambda valida o CPF, chama `POST /api/v1/auth/cpf` na OS e devolve o JWT assinado pela OS. O `oficina-mecanica-infra-k8s` publica o API Gateway. A OS e o billing publicam os hostnames dos balanceadores que o gateway consome.

## Ownership

| Responsabilidade | Repositório |
| --- | --- |
| Lambda, bundle e `OS_BASE_URL` | `lambda-auth` |
| API Gateway, rotas e permissão de invocação | `infra-k8s` |
| Cliente, token e NLB da OS | `oficina-mecanica-os-service` |
| Checkout, cobrança e NLB do billing | `oficina-mecanica-billing-service` |

Não crie API Gateway neste repositório. A função não recebe `JWT_SECRET` nem `SAGA_TOKEN`.

## Contratos SSM

```text
/oficina/<ambiente>/platform/auth-lambda-arn
/oficina/<ambiente>/services/os-nlb-hostname
/oficina/<ambiente>/services/billing-checkout-nlb-hostname
```

`lambda-auth` publica o ARN. O deploy da OS publica `os-nlb-hostname`. O deploy do billing publica `billing-checkout-nlb-hostname`. O root do ambiente no infra-k8s lê os três. Não crie esses parâmetros à mão.

## Sequência

1. Suba o cluster e faça o deploy da OS, do billing e da execução.
2. Aplique a Lambda com `environment` igual ao ambiente e `os_base_url` apontando para o NLB da OS.
3. Confirme que os três parâmetros existem, sem imprimir valores.
4. No infra-k8s, gere o plan do ambiente. Ele falha de propósito se algum dos três contratos ainda não existir.
5. Aplique o gateway somente depois dessa revisão.
6. Teste `POST /auth/cpf`, `GET /api/v1/health` e o checkout pelo endpoint do gateway.

| Rota | Destino |
| --- | --- |
| `POST /auth/cpf` | Lambda |
| `GET /api/v1/pagamentos/{osId}/checkout` e `POST .../cobrar` | NLB do billing |
| `ANY /{proxy+}` | NLB da OS |

## Diagnóstico

- **`auth-lambda-arn` ausente:** o apply da Lambda não terminou naquele ambiente.
- **Hostname ausente:** o deploy da OS ou do billing ainda não publicou o Service. Repita o deploy. Não escreva o hostname no Terraform.
- **`POST /auth/cpf` falha e o health da OS responde:** a Lambda não está alcançando `OS_BASE_URL`, ou o CPF não existe na OS.
- **Checkout falha e o health da OS responde:** o gateway ainda não tem a rota do billing, ou o NLB do checkout não está publicado.

## Validação local

```bash
npm ci
npm test
npm run build
npm run test:integration
terraform -chdir=infra fmt -check -recursive
terraform -chdir=infra init -backend=false
terraform -chdir=infra validate
```

Não execute `apply` como parte do teste local.
