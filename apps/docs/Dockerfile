# PHASE 1
# Setup the base image with the required tools.

FROM node:22.6-alpine3.20 AS base

ENV PROJECT=docs

RUN npm install -g turbo@^2

# # # # # # # # #


# PHASE 2
# Because this is a monorepo with turbopack, it is necessary
# to prune the project to remove unnecessary files.

FROM base AS pruner

WORKDIR /app

COPY . .

RUN turbo prune --scope=@carrismetropolitana/api-${PROJECT} --docker

# # # # # # # # #


# PHASE 3
# Install the project dependencies and build the project.

FROM base AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=pruner /app/out/full/ .
RUN npm install --omit-dev \
	&& npm cache clean --force

RUN npx @helperkits/bumper bump

RUN turbo run build --filter=@carrismetropolitana/api-${PROJECT}

RUN echo "aftercopy/----------------------------------------"
RUN ls -la /app/apps/${PROJECT}

# # # # # # # # #


# PHASE 4
# Setup the final Docker image with only the required files.

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/${PROJECT}/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/${PROJECT}/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${PROJECT}/.next/standalone ./

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD node /app/apps/${PROJECT}/server.js