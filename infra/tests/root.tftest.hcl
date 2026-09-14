mock_provider "aws" {
  override_during = plan

  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
    }
  }
}

mock_provider "archive" {
  override_during = plan
}

override_resource {
  target          = aws_lambda_function.auth
  override_during = plan
  values = {
    arn = "arn:aws:lambda:us-east-1:123456789012:function:oficina-mecanica-auth-cpf-homologacao"
  }
}

variables {
  environment       = "homologacao"
  aws_region        = "us-east-1"
  lambda_role_arn   = "arn:aws:iam::123456789012:role/test-lambda"
  function_name     = "oficina-mecanica-auth-cpf-homologacao"
  jwt_secret        = "test-jwt-secret"
  postgres_host     = "db.example.internal"
  postgres_user     = "oficina"
  postgres_password = "test-password"
  postgres_db       = "oficina_mecanica"
}

run "publishes_environment_scoped_lambda_arn_contract" {
  command = plan

  assert {
    condition     = aws_ssm_parameter.auth_lambda_arn.name == "/oficina/homologacao/platform/auth-lambda-arn"
    error_message = "The Lambda ARN must be published under the environment-scoped SSM contract."
  }

  assert {
    condition     = aws_ssm_parameter.auth_lambda_arn.type == "String"
    error_message = "The Lambda ARN contract must be a String parameter."
  }

  assert {
    condition     = aws_ssm_parameter.auth_lambda_arn.value == aws_lambda_function.auth.arn
    error_message = "The SSM contract must contain the ARN of the Lambda owned by this state."
  }
}

run "rejects_unknown_environment" {
  command = plan

  variables {
    environment = "staging"
  }

  expect_failures = [var.environment]
}

run "exposes_lambda_contract_output" {
  command = plan

  assert {
    condition     = output.lambda_function_arn == aws_lambda_function.auth.arn
    error_message = "The Lambda root must expose its ARN for the API Gateway consumer contract."
  }

  assert {
    condition     = output.auth_lambda_arn_parameter_name == "/oficina/homologacao/platform/auth-lambda-arn"
    error_message = "The Lambda root must expose the environment-scoped contract name."
  }
}
