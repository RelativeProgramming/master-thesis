#!/bin/sh
BIN_DIR=`dirname "$0"`
export JQASSISTANT_HOME=`cd "$BIN_DIR/.." && pwd -P`
java $JQASSISTANT_OPTS -jar "$JQASSISTANT_HOME/lib/com.buschmais.jqassistant.cli-jqassistant-commandline-neo4jv3-1.12.0-M1.jar" "$@"
