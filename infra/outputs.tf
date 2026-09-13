output "lambda_function_name" {
  value = aws_lambda_function.auth.function_name
}

output "lambda_function_arn" {
  description = "ARN da Lambda publicado no contrato SSM para o infra-k8s."
  value       = aws_lambda_function.auth.arn
}

output "auth_lambda_arn_parameter_name" {
  description = "Nome do parametro SSM com o ARN da Lambda."
  value       = aws_ssm_parameter.auth_lambda_arn.name
}
