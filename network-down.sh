# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

. scripts/utils.sh

# Obtain CONTAINER_IDS and remove them
# This function is called when you bring a network down
function clearContainers() {
    infoln "Removing remaining containers"
    docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true
    docker rm -f $(docker ps -aq --filter name='dev-peer*') 2>/dev/null || true
}

# Delete any images that were generated as a part of this setup
# specifically the following images are often left behind:
# This function is called when you bring the network down
function removeUnwantedImages() {
    infoln "Removing generated chaincode docker images"
    docker image rm -f $(docker images -aq --filter reference='dev-peer*') 2>/dev/null || true
}

DOCKER_SOCK=$DOCKER_SOCK docker-compose -f docker/docker-compose-ca.yaml -f docker/docker-compose-network.yaml -p e-jazah_network down --volumes --remove-orphans

# Bring down the network, deleting the volumes
docker volume rm e-jazah_network_orderer.e-jazah.id e-jazah_network_orderer2.e-jazah.id e-jazah_network_peer0.org1.e-jazah.id e-jazah_network_peer1.org1.e-jazah.id e-jazah_network_peer2.org1.e-jazah.id  e-jazah_network_peer0.org2.e-jazah.id e-jazah_network_peer1.org2.e-jazah.id e-jazah_network_peer2.org2.e-jazah.id
#Cleanup the chaincode containers
clearContainers
#Cleanup images
removeUnwantedImages
#
docker kill $(docker ps -q --filter name=ccaas) || true
# remove orderer block and other channel configuration transactions and certs
docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf system-genesis-block/*.block organizations/peerOrganizations organizations/ordererOrganizations'
## remove fabric ca artifacts
docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/org1/msp organizations/fabric-ca/org1/tls-cert.pem organizations/fabric-ca/org1/ca-cert.pem organizations/fabric-ca/org1/IssuerPublicKey organizations/fabric-ca/org1/IssuerRevocationPublicKey organizations/fabric-ca/org1/fabric-ca-server.db'
docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/org2/msp organizations/fabric-ca/org2/tls-cert.pem organizations/fabric-ca/org2/ca-cert.pem organizations/fabric-ca/org2/IssuerPublicKey organizations/fabric-ca/org2/IssuerRevocationPublicKey organizations/fabric-ca/org2/fabric-ca-server.db'
docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/ordererOrg/msp organizations/fabric-ca/ordererOrg/tls-cert.pem organizations/fabric-ca/ordererOrg/ca-cert.pem organizations/fabric-ca/ordererOrg/IssuerPublicKey organizations/fabric-ca/ordererOrg/IssuerRevocationPublicKey organizations/fabric-ca/ordererOrg/fabric-ca-server.db'

# remove channel and script artifacts
docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf channel-artifacts log.txt *.tar.gz'