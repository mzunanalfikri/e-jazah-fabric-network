#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Modified by : Muhammad Zunan Alfikri

. scripts/utils.sh

# timeout duration - the duration the CLI should wait for a response from
# another container before giving up
MAX_RETRY=5
# default for delay between commands
CLI_DELAY=3
# channel name defaults to "mychannel"
CHANNEL_NAME="mychannel"
# chaincode name defaults to "NA"
CC_NAME="NA"
# chaincode path defaults to "NA"
CC_SRC_PATH="NA"
# endorsement policy defaults to "NA". This would allow chaincodes to use the majority default policy.
CC_END_POLICY="NA"
# collection configuration defaults to "NA"
CC_COLL_CONFIG="NA"
# chaincode init function defaults to "NA"
CC_INIT_FCN="NA"
# use this as the default docker-compose yaml definition
COMPOSE_FILE_BASE=docker/docker-compose-network.yaml
# certificate authorities compose file
COMPOSE_FILE_CA=docker/docker-compose-ca.yaml
# use this as the docker compose couch file for org3

# chaincode language defaults to "NA"
CC_SRC_LANGUAGE="NA"
# default to running the docker commands for the CCAAS
CCAAS_DOCKER_RUN=true
# Chaincode version
CC_VERSION="1.0"
# Chaincode definition sequence
CC_SEQUENCE=1
# default database
DATABASE="leveldb"

# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

function networkUp() {
    createOrgs

    DOCKER_SOCK="${DOCKER_SOCK}" docker-compose -f $COMPOSE_FILE_BASE -p e-jazah_network up -d 2>&1

    docker ps -a
    if [ $? -ne 0 ]; then
        fatalln "Unable to start network"
    fi
}

function createOrgs() {
    if [ -d "organizations/peerOrganizations" ]; then
        rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
    fi

    infoln "Generating certificates using Fabric CA"
    docker-compose -f $COMPOSE_FILE_CA -p e-jazah_network up -d 2>&1

    . organizations/fabric-ca/registerEnroll.sh

    while :; do
        if [ ! -f "organizations/fabric-ca/org1/tls-cert.pem" ]; then
            sleep 1
        else
            break
        fi
    done

    infoln "Creating Org1 Identities"

    createOrg1

    infoln "Creating Orderer Org Identities"

    createOrderer

    infoln "Generating CCP files for Org1 and Org2"
    ./organizations/ccp-generate.sh
}

########################
##### MAIN PROGRAM #####
########################
networkUp
# docker-compose -f $COMPOSE_FILE_CA -p e-jazah_network up -d 2>&1