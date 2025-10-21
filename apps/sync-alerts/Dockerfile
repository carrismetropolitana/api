# # #
# DEFINE THE BASE IMAGE

FROM node:24-alpine AS base

ENV MODULE=sync-alerts

RUN npm install -g turbo@^2


# # #
# BUILDER STAGE

FROM base AS pruner

WORKDIR /app

COPY . .

RUN turbo prune --scope=@carrismetropolitana/api-${MODULE} --docker


# # #
# INSTALLER STAGE

FROM base AS builder

WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@carrismetropolitana/api-${MODULE}


# # #
# RUNNER STAGE

FROM base AS runner

WORKDIR /app

COPY --from=builder /app .

CMD node apps/${MODULE}/dist/index.js