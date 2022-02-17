# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

DOCKER_SOCK=$DOCKER_SOCK docker-compose -f docker/docker-compose-ca.yaml -f docker/docker-compose-network.yaml -p e-jazah_network down --volumes --remove-orphans

rm -rf organizations/fabric-ca/ordererOrg/msp
rm organizations/fabric-ca/ordererOrg/ca-cert.pem 
rm organizations/fabric-ca/ordererOrg/fabric-ca-server.db
rm organizations/fabric-ca/ordererOrg/IssuerPublicKey
rm organizations/fabric-ca/ordererOrg/IssuerRevocationPublicKey
rm organizations/fabric-ca/ordererOrg/tls-cert.pem

rm -rf organizations/fabric-ca/org1/msp
rm organizations/fabric-ca/org1/ca-cert.pem 
rm organizations/fabric-ca/org1/fabric-ca-server.db
rm organizations/fabric-ca/org1/IssuerPublicKey
rm organizations/fabric-ca/org1/IssuerRevocationPublicKey
rm organizations/fabric-ca/org1/tls-cert.pem

rm -rf organizations/ordererOrganizations
rm -rf organizations/peerOrganizations