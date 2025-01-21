###########################
# Define the base image
###########################
FROM node:20.16-alpine AS base

ENV PROJECT=server

RUN npm install -g turbo@^2

###########################
# Builder stage
###########################
FROM base AS pruner

WORKDIR /app

COPY . .

RUN turbo prune --scope=@carrismetropolitana/api-${PROJECT} --docker

###########################
# Installer stage
###########################
FROM base AS builder

WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@carrismetropolitana/api-${PROJECT}


# ###########################
# # Runner stage
# ###########################
FROM base AS runner

WORKDIR /app

COPY --from=builder /app .

CMD node apps/$PROJECT/dist/index.js
