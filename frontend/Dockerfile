FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install 

COPY . .

# Accept the API URL as a build arguments

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--port", "5173", "--host"]




