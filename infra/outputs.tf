output "api_endpoint" {
  description = "URL base do API Gateway. POST {api_endpoint}/auth/cpf e proxy {api_endpoint}/api/..."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "nest_proxy_enabled" {
  value = local.nest_proxy_enabled
}

output "lambda_function_name" {
  value = aws_lambda_function.auth.function_name
}
