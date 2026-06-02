FROM node:20-alpine AS builder
WORKDIR /workspace
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/tsconfig.json frontend/tailwind.config.ts frontend/postcss.config.js frontend/next.config.mjs ./
COPY frontend/ .
RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /workspace
COPY --from=builder /workspace/.next .next
COPY --from=builder /workspace/node_modules node_modules
COPY --from=builder /workspace/package.json .
COPY frontend/public ./public
EXPOSE 3000
CMD ["npm", "start"]
