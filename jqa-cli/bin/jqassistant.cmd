@echo off
set JQASSISTANT_HOME=%~dp0%\..
java %JQASSISTANT_OPTS% -jar "%JQASSISTANT_HOME%\lib\com.buschmais.jqassistant.cli-jqassistant-commandline-neo4jv3-1.12.0-M1.jar" %*
