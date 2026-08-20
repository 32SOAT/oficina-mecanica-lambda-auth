variable "aws_region" {
  type        = string
  description = "Regiao AWS."
  default     = "us-east-1"
}

variable "function_name" {
  type    = string
  default = "oficina-mecanica-auth-cpf"
}

variable "lambda_role_arn" {
  type        = string
  description = "ARN da role de execucao. No AWS Academy use o LabRole. Deixe vazio para criar uma role (conta pessoal)."
  default     = ""
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_expires_in" {
  type    = string
  default = "1h"
}

variable "postgres_host" {
  type = string
}

variable "postgres_port" {
  type    = number
  default = 5432
}

variable "postgres_user" {
  type = string
}

variable "postgres_password" {
  type      = string
  sensitive = true
}

variable "postgres_db" {
  type    = string
  default = "oficina_mecanica"
}

variable "postgres_ssl" {
  type    = string
  default = "1"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnets privadas do RDS. Vazio = Lambda sem VPC (nao alcança o banco)."
  default     = []
}

variable "security_group_ids" {
  type    = list(string)
  default = []
}

variable "nest_api_url" {
  type        = string
  description = "URL publica do Nest (NLB), ex: http://xxxx.elb.us-east-1.amazonaws.com. Vazio = so POST /auth/cpf."
  default     = ""

  validation {
    condition     = var.nest_api_url == "" || can(regex("^https?://", var.nest_api_url))
    error_message = "nest_api_url deve comecar com http:// ou https:// (hostname do NLB, sem barra no final)."
  }
}
