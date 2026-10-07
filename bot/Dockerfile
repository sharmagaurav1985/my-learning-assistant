FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3978
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --chown=node:node src ./src
USER node
EXPOSE 3978
CMD ["node", "src/index.js"]
