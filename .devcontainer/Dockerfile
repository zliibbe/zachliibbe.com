FROM node:22-bookworm-slim

# System tools needed for development and Claude Code
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    procps \
    sudo \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Bun at the version pinned in package.json packageManager field
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.8" \
    && ln -sf /root/.bun/bin/bun /usr/local/bin/bun

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Give the built-in node user (UID 1000) passwordless sudo
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

USER node
WORKDIR /workspace
