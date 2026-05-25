FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORTAL_SERVE_STATIC=true
ENV PORTAL_API_PORT=3004
ENV PORTAL_API_BASE=/portal-api

COPY dist ./dist
COPY server-dist ./server-dist

EXPOSE 3004

CMD ["node", "server-dist/index.cjs"]
