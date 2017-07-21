#!/bin/bash -ex

exit 1

pushd `dirname $0`/.. > /dev/null
root=$(pwd -P)
popd > /dev/null

source $root/ci/vars.sh


## Install Dependencies ########################################################

npm install
./node_modules/.bin/typings install


## Build #######################################################################

NODE_ENV=production npm run build
cp nginx.conf dist/

#
# Package artifacts
#

pushd dist
zip -r ../${APP}.${EXT} .
popd > /dev/null
