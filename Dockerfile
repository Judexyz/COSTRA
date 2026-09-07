FROM php:8.4-cli

# Install mysqli extension (requires mysqli/pdo_mysql build deps)
RUN docker-php-ext-install mysqli pdo_mysql

WORKDIR /app

COPY . .

# Railway injects $PORT at runtime; default to 8080 for local use only
ENV PORT=8080
EXPOSE 8080

# Use explicit shell form so $PORT is expanded at container start
CMD ["sh", "-c", "exec php -S 0.0.0.0:$PORT -t ."]
