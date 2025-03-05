FROM alpine:latest

ARG PB_VERSION=0.25.8

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# uncomment to copy the local pb_migrations dir into the image
# COPY ./pb_migrations /pb/pb_migrations

# uncomment to copy the local pb_hooks dir into the image
# COPY ./pb_hooks /pb/pb_hooks

EXPOSE 8090

# Create a startup script
RUN echo '#!/bin/sh' > /pb/start.sh && \
    echo 'if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then' >> /pb/start.sh && \
    echo '  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" || echo "Failed to create superuser"' >> /pb/start.sh && \
    echo 'fi' >> /pb/start.sh && \
    echo '/pb/pocketbase serve --http=0.0.0.0:8090' >> /pb/start.sh && \
    chmod +x /pb/start.sh

# start PocketBase
CMD ["/pb/start.sh"]