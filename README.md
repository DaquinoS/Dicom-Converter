# DICOM Converter

Essa aplicação tem como objetivo realizar a crição de arquivos DICOM no formato DICOM Json utilizando-se dos pacotes:

1. static-wado-creator
2. static-wado-webserver

## WADO Creator

O Wado Creator captura os arquivos .dcm presentes no diretório de input configurado no arquivo config.ini e realiza a conversão
dos mesmos para o formato DICOM Json e os armazena no diretório de saída que também é configurado no arquivo config.ini.

## WADO WebServer

É responsável por ler os arquivos presentes na pasta de saída configurada no config.ini e fornecer os dados para o frontend através do endpoint /dicomweb

## Onde entra o funcionamento desta aplicação?

Essa aplicação (DICOM Converter), ouve a pasta de inputs e aciona o WADO Creator toda vez que novos arquivos são detectados. Além disso, ela
dispara um evento para o frontend informando que existem novos arquivos disponíveis através do SSE (Server Side Events)