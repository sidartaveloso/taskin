FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# O rastreador de tarefas e o proprio taskin, que ja vive neste repositorio —
# nao ha CLI externa para instalar. O que falta sao as duas ferramentas que
# `pnpm install` exige aqui:
#
#   * pnpm, que a imagem base traz via corepack, na versao fixada pelo campo
#     `packageManager` do package.json;
#   * uv, porque o pacote `types-py` roda `uv sync` no seu script de install —
#     sem ele o `pnpm install` falha antes de instalar qualquer coisa.
#
# O `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` nao e zelo: sem ele o corepack **pergunta**
# antes de baixar o pnpm fixado em `packageManager`, e num container sem terminal
# a pergunta fica esperando uma resposta que nunca vem. O sintoma e cruel — o
# `pnpm install` nao imprime nada e o hook morre no timeout, sem nenhuma pista de
# que o processo estava parado num prompt.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Build-args for UID/GID alignment: sandcastle docker build-image
# defaults these to the host user's UID/GID so image-built files
# and bind-mounted files share an owner without runtime chown.
ARG AGENT_UID=1000
ARG AGENT_GID=1000

# Rename the base image's "node" user to "agent" and align UID/GID.
RUN groupmod -o -g $AGENT_GID node && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node
USER ${AGENT_UID}:${AGENT_GID}

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Add Claude to PATH
ENV PATH="/home/agent/.local/bin:$PATH"

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["sleep", "infinity"]
