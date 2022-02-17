#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${P1PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${P1PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# org 1 peer 0
ORG=1
P0PORT=7051
P1PORT=9051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/org1.e-jazah.id/tlsca/tlsca.org1.e-jazah.id-cert.pem
CAPEM=organizations/peerOrganizations/org1.e-jazah.id/ca/ca.org1.e-jazah.id-cert.pem

echo "$(json_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.e-jazah.id/connection-org1.json
echo "$(yaml_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.e-jazah.id/connection-org1.yaml

# ORG=2
# P0PORT=9051
# CAPORT=8054
# PEERPEM=organizations/peerOrganizations/org2.e-jazah.id/tlsca/tlsca.org2.e-jazah.id-cert.pem
# CAPEM=organizations/peerOrganizations/org2.e-jazah.id/ca/ca.org2.e-jazah.id-cert.pem

# echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.e-jazah.id/connection-org2.json
# echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.e-jazah.id/connection-org2.yaml
