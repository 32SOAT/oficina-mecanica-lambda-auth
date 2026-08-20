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
      JWT_SECRET                       = var.jwt_secret
      JWT_EXPIRES_IN                   = var.jwt_expires_in
      POSTGRES_HOST                    = var.postgres_host
      POSTGRES_PORT                    = tostring(var.postgres_port)
      POSTGRES_USER                    = var.postgres_user
      POSTGRES_PASSWORD                = var.postgres_password
      POSTGRES_DB                      = var.postgres_db
      POSTGRES_SSL                     = var.postgres_ssl
      POSTGRES_SSL_REJECT_UNAUTHORIZED = "0"
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

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.function_name}-http"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type", "authorization"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "cpf" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /auth/cpf"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
