locals {
  nest_api_url       = trimsuffix(trimspace(var.nest_api_url), "/")
  nest_proxy_enabled = local.nest_api_url != ""
}

resource "aws_apigatewayv2_integration" "nest" {
  count = local.nest_proxy_enabled ? 1 : 0

  api_id               = aws_apigatewayv2_api.http.id
  integration_type     = "HTTP_PROXY"
  integration_method   = "ANY"
  integration_uri      = "${local.nest_api_url}/{proxy}"
  connection_type      = "INTERNET"
  timeout_milliseconds = 29000
}

resource "aws_apigatewayv2_route" "nest" {
  count = local.nest_proxy_enabled ? 1 : 0

  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.nest[0].id}"
}
