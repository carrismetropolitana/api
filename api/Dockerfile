
# # # # # # # # #

FROM node:alpine AS base

# # # # # # # # #


# PHASE 1
# Install dependencies only when needed.

FROM base AS dependencies

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json ./

RUN npm --omit=dev install

# # # # # # # # #


# PHASE 2
# Rebuild the source code only when needed.

FROM base AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .


# # # # # # # # #


# PHASE 3
# Setup the final Docker image with only the required files.

FROM base AS runner

WORKDIR /app

ENV NODE_ENV production

COPY . .

CMD ["node", "index.js"]