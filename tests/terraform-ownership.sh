#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
terraform_file="${repo_root}/infra/lambda.tf"

if rg -n 'aws_apigatewayv2|aws_lambda_permission|apigateway.amazonaws.com|nest_api_url' "${terraform_file}"; then
  printf 'Lambda state still contains API Gateway ownership.\n' >&2
  exit 1
fi

rg -n 'auth-lambda-arn|aws_ssm_parameter' "${terraform_file}" >/dev/null
printf 'Lambda ownership contract checks passed.\n'
