#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
. scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/e-jazah.id/tlsca/tlsca.e-jazah.id-cert.pem
export ORG1_CA=${PWD}/organizations/peerOrganizations/org1.e-jazah.id/tlsca/tlsca.org1.e-jazah.id-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer.e-jazah.id/tls/server.crt
export ORDERER2_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer2.e-jazah.id/tls/server.crt
export ORDERER3_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer3.e-jazah.id/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer.e-jazah.id/tls/server.key
export ORDERER2_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer2.e-jazah.id/tls/server.key
export ORDERER3_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/e-jazah.id/orderers/orderer3.e-jazah.id/tls/server.key

# Set environment variables for the peer org
setGlobals() {
   local USING_ORG=""
   if [ -z "$OVERRIDE_ORG" ]; then
      USING_ORG=$1
   else
      USING_ORG="${OVERRIDE_ORG}"
   fi
   if [ $USING_ORG -eq 1 ]; then
      infoln "Using peer 0, port 7051"
      export CORE_PEER_LOCALMSPID="Org1MSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$ORG1_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.e-jazah.id/users/Admin@org1.e-jazah.id/msp
      export CORE_PEER_ADDRESS=localhost:7051
   elif [ $USING_ORG -eq 2 ]; then
      infoln "Using peer 1, port 9051"
      export CORE_PEER_LOCALMSPID="Org1MSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$ORG1_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.e-jazah.id/users/Admin@org1.e-jazah.id/msp
      export CORE_PEER_ADDRESS=localhost:9051
   elif [ $USING_ORG -eq 3 ]; then
      infoln "Using peer 2, port 11051"
      export CORE_PEER_LOCALMSPID="Org1MSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=$ORG1_CA
      export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.e-jazah.id/users/Admin@org1.e-jazah.id/msp
      export CORE_PEER_ADDRESS=localhost:11051
   else
      errorln "ORG Unknown"
   fi

   if [ "$VERBOSE" == "true" ]; then
      env | grep CORE
   fi
}

# Set environment variables for use in the CLI container
setGlobalsCLI() {
   setGlobals $1

   local USING_ORG=""
   if [ -z "$OVERRIDE_ORG" ]; then
      USING_ORG=$1
   else
      USING_ORG="${OVERRIDE_ORG}"
   fi
   if [ $USING_ORG -eq 1 ]; then
      export CORE_PEER_ADDRESS=peer0.org1.e-jazah.id:7051
   elif [ $USING_ORG -eq 2 ]; then
      export CORE_PEER_ADDRESS=peer1.org2.e-jazah.id:9051
   elif [ $USING_ORG -eq 3 ]; then
      export CORE_PEER_ADDRESS=peer2.org3.e-jazah.id:11051
   else
      errorln "ORG Unknown"
   fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
   PEER_CONN_PARMS=()
   PEERS=""
   while [ "$#" -gt 0 ]; do
      setGlobals $1
      i=$1
      ((i--))
      PEER="peer$i.org1"
      ## Set peer addresses
      if [ -z "$PEERS" ]; then
         PEERS="$PEER"
      else
         PEERS="$PEERS $PEER"
      fi
      PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
      ## Set path to TLS certificate
      CA=ORG1_CA
      TLSINFO=(--tlsRootCertFiles "${!CA}")
      PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
      # shift by one to get to the next organization
      shift
   done
}

verifyResult() {
   if [ $1 -ne 0 ]; then
      fatalln "$2"
   fi
}
