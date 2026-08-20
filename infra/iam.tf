data "aws_iam_policy_document" "assume_lambda" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  count = trimspace(var.lambda_role_arn) == "" ? 1 : 0

  name               = "${var.function_name}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json
}

resource "aws_iam_role_policy_attachment" "basic" {
  count = trimspace(var.lambda_role_arn) == "" ? 1 : 0

  role       = aws_iam_role.lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "vpc" {
  count = trimspace(var.lambda_role_arn) == "" && length(var.subnet_ids) > 0 ? 1 : 0

  role       = aws_iam_role.lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

locals {
  lambda_role_arn = trimspace(var.lambda_role_arn) != "" ? var.lambda_role_arn : aws_iam_role.lambda[0].arn
}
