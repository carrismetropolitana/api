# # # # # # # # #

FROM node:22.6-alpine3.20 AS base

# # # # # # # # #


# PHASE 1
# Install dependencies only when needed.

FROM base AS dependencies

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json ./

RUN npm install --omit-dev --force \
    && npm cache clean --force


# # # # # # # # #


# PHASE 2
# Rebuild the source code only when needed.

FROM base AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npx @helperkits/bumper bump

RUN npm run build


# # # # # # # # #


# PHASE 3
# Setup the final Docker image with only the required files.

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]