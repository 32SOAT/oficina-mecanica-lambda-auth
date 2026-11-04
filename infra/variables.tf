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

variable "os_base_url" {
  type        = string
  description = "URL da OS, sem barra no final. A Lambda consulta POST /api/v1/clientes/consulta-auth."

  validation {
    condition     = can(regex("^https?://", var.os_base_url))
    error_message = "os_base_url deve comecar com http:// ou https://."
  }
}

variable "saga_token" {
  type        = string
  description = "Mesmo SAGA_TOKEN configurado na OS."
  sensitive   = true
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnets da Lambda. Vazio deixa a funcao fora da VPC, alcançando a OS pela URL publica."
  default     = []
}

variable "security_group_ids" {
  type    = list(string)
  default = []
}
