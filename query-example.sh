
export FABRIC_CFG_PATH=$PWD/config/

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.e-jazah.id/peers/peer0.org1.e-jazah.id/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.e-jazah.id/users/Admin@org1.e-jazah.id/msp
export CORE_PEER_ADDRESS=localhost:7051

peer chaincode invoke -o localhost:8050 --ordererTLSHostnameOverride orderer2.e-jazah.id --tls --cafile ${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer2.e-jazah.id/msp/tlscacerts/tlsca.e-jazah.id-cert.pem -C main-channel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.e-jazah.id/peers/peer0.org1.e-jazah.id/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.e-jazah.id/peers/peer1.org1.e-jazah.id/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'
