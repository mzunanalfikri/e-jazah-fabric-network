# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

DOCKER_SOCK=$DOCKER_SOCK docker-compose -f docker/docker-compose-ca.yaml -f docker/docker-compose-network.yaml -p e-jazah_network down --volumes --remove-orphans