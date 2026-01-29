# Proxy Support

Proxy configuration for browser automation.

## Basic Setup

Proxies are configured via command-line flag or environment variables:

```bash
# Via command-line flag
agent-browser --proxy http://proxy.example.com:8080 open https://example.com

# Via environment variable
HTTP_PROXY=http://proxy.example.com:8080 agent-browser open https://example.com
HTTPS_PROXY=http://proxy.example.com:8080 agent-browser open https://example.com
ALL_PROXY=http://proxy.example.com:8080 agent-browser open https://example.com
```

## Authentication

Credentials can be included directly in the proxy URL:

```bash
agent-browser --proxy http://username:password@proxy.example.com:8080 open https://example.com
```

## Proxy Types Supported

### HTTP/HTTPS Proxies

```bash
agent-browser --proxy http://proxy.example.com:8080 open https://example.com
agent-browser --proxy https://proxy.example.com:8443 open https://example.com
```

### SOCKS5 Proxies

```bash
agent-browser --proxy socks5://proxy.example.com:1080 open https://example.com
agent-browser --proxy socks5://user:pass@proxy.example.com:1080 open https://example.com
```

## Bypass Configuration

Use `NO_PROXY` to specify domains that should skip the proxy:

```bash
NO_PROXY=localhost,127.0.0.1,.internal.com agent-browser --proxy http://proxy:8080 open https://example.com
```

## Use Cases

### Geo-location Testing

```bash
# Test from different regions using regional proxies
agent-browser --proxy http://us-proxy.example.com:8080 open https://example.com
agent-browser screenshot ./us-view.png

agent-browser --proxy http://eu-proxy.example.com:8080 open https://example.com
agent-browser screenshot ./eu-view.png
```

### Rotating Proxies

```bash
#!/bin/bash
# Cycle through proxy list

PROXIES=(
    "http://proxy1.example.com:8080"
    "http://proxy2.example.com:8080"
    "http://proxy3.example.com:8080"
)

for i in "${!PROXIES[@]}"; do
    agent-browser --proxy "${PROXIES[$i]}" open https://example.com
    agent-browser get text body > "output-$i.txt"
    agent-browser close
done
```

### Corporate Networks

```bash
# Route external traffic through corporate proxy, bypass for internal
NO_PROXY=.internal.corp,localhost \
agent-browser --proxy http://corporate-proxy:8080 open https://external-site.com
```

## Verification

Check your apparent IP to confirm proxy usage:

```bash
agent-browser --proxy http://proxy:8080 open https://httpbin.org/ip
agent-browser get text body
```

## Troubleshooting

### Test Proxy Connectivity First

```bash
# Test with curl before using agent-browser
curl -x http://proxy:8080 https://httpbin.org/ip
```

### SSL/TLS Inspection Issues

Some corporate proxies perform SSL inspection. If you encounter certificate errors:

```bash
agent-browser --proxy http://proxy:8080 open https://example.com --ignore-https-errors
```

### Performance Optimization

Exclude CDN traffic from proxy to improve performance:

```bash
NO_PROXY=.cloudflare.com,.akamai.net,.fastly.net agent-browser --proxy http://proxy:8080 open https://example.com
```

## Best Practices

1. **Use environment variables for credentials** - Don't hardcode proxy passwords
2. **Set appropriate bypass rules** - Exclude local and CDN traffic
3. **Test connectivity before automation** - Verify proxy works with curl first
4. **Implement retry logic** - Proxies can be unreliable
5. **Rotate proxies for large-scale operations** - Distribute load and avoid blocks
