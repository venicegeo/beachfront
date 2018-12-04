#!/bin/bash -ex

root=$(pwd -P)

source $root/ci/vars.sh

## Install Dependencies ########################################################

npm install
./node_modules/.bin/typings install


## Run Tests ###################################################################

if [ $(uname) == Darwin ]
  then npm run test:coverage           # Local development
  else xvfb-run npm run test:coverage  # Jenkins
fi


# HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
# HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK

# Note: This is a workaround for the fact that SonarQube currently doesn't support
#       Typescript.  It can be removed once(if?) they release an official plugin
#       for it.
#
#       It should also be noted that this method precludes the ability to view
#       git blame for a file since the transpiled sources are generated on the
#       fly.

# Generate artifacts Sonar can actually parse
./node_modules/.bin/tsc

# Update the coverage report to point to the transpiled sources
cp report/coverage/lcov.info report/coverage/lcov.info~
sed -E 's/\.tsx?$/.js/' report/coverage/lcov.info~ > report/coverage/lcov.info

# HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
# HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
