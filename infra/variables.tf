variable "aws_region" {
  type        = string
  description = "Regiao AWS."
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Ambiente cujo contrato SSM sera publicado."
  default     = "homologacao"

  validation {
    condition     = contains(["homologacao", "producao"], var.environment)
    error_message = "environment deve ser homologacao ou producao."
  }
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
