FROM node:22-alpine

# FFmpeg is required for caption burn, audio extraction, SFX mixing, and
# orientation transforms.
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install all deps (including devDeps so tsx is available at runtime)
COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
