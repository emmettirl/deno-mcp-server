# Multi-stage build for Deno MCP Server
FROM denoland/deno:alpine-1.40.0 AS builder

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies and build
RUN deno cache src/main.ts
RUN deno compile \
    --allow-read \
    --allow-write \
    --allow-run \
    --output deno-mcp-server \
    cli.ts

# Production stage
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tini

# Create non-root user
RUN adduser -D -s /bin/sh mcpuser

# Create directories
RUN mkdir -p /app /data && \
    chown -R mcpuser:mcpuser /app /data

# Copy binary from builder
COPY --from=builder --chown=mcpuser:mcpuser /app/deno-mcp-server /app/

# Copy documentation
COPY --chown=mcpuser:mcpuser README.md LICENSE /app/

# Switch to non-root user
USER mcpuser

# Set working directory
WORKDIR /data

# Expose no ports by default (stdio mode)
EXPOSE 0

# Set entrypoint
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/deno-mcp-server"]

# Metadata
LABEL \
    org.opencontainers.image.title="Deno MCP Server" \
    org.opencontainers.image.description="A secure Model Context Protocol server for Deno development workflows" \
    org.opencontainers.image.url="https://github.com/emmettirl/deno-mcp-server" \
    org.opencontainers.image.source="https://github.com/emmettirl/deno-mcp-server" \
    org.opencontainers.image.vendor="Emmett Fitzharris" \
    org.opencontainers.image.licenses="MIT"
