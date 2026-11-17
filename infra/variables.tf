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
  type        = string
  description = "Obsoleto. A OS assina o JWT. Mantido para tfvars antigos e nao e injetado na funcao."
  sensitive   = true
  default     = null
  nullable    = true
}

variable "jwt_expires_in" {
  type        = string
  description = "Obsoleto. A OS define a validade do JWT. Nao e injetado na funcao."
  default     = null
  nullable    = true
}

variable "os_base_url" {
  type        = string
  description = "URL da OS, sem barra no final. A Lambda chama POST /api/v1/auth/cpf."

  validation {
    condition     = can(regex("^https?://", var.os_base_url))
    error_message = "os_base_url deve comecar com http:// ou https://."
  }
}

variable "saga_token" {
  type        = string
  description = "Obsoleto. A autenticacao por CPF nao usa o token da saga. Nao e injetado na funcao."
  sensitive   = true
  default     = null
  nullable    = true
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
