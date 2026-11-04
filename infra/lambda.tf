data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/../dist/handler.js"
  output_path = "${path.module}/../dist/handler.zip"
}

resource "aws_lambda_function" "auth" {
  function_name    = var.function_name
  role             = local.lambda_role_arn
  handler          = "handler.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  timeout          = 10
  memory_size      = 256

  environment {
    variables = {
      JWT_SECRET     = var.jwt_secret
      JWT_EXPIRES_IN = var.jwt_expires_in
      OS_BASE_URL    = var.os_base_url
      SAGA_TOKEN     = var.saga_token
    }
  }

  dynamic "vpc_config" {
    for_each = length(var.subnet_ids) > 0 ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }
}

resource "aws_ssm_parameter" "auth_lambda_arn" {
  name        = "/oficina/${var.environment}/platform/auth-lambda-arn"
  description = "ARN da Lambda de autenticacao consumido pelo infra-k8s."
  type        = "String"
  value       = aws_lambda_function.auth.arn

  tags = {
    Component   = "platform-contract"
    Environment = var.environment
    Owner       = "lambda-auth"
    Source      = "oficina-mecanica-lambda-auth"
  }
}
