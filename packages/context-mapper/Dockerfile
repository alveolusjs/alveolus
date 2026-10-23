# Context Mapper CLI (https://contextmapper.org): validates the CML model and generates the context map.
FROM eclipse-temurin:17-jre

RUN apt-get update \
	&& apt-get install --yes --no-install-recommends curl graphviz \
	&& rm -rf /var/lib/apt/lists/*

ARG CONTEXT_MAPPER_VERSION=6.12.0
RUN curl -fsSL "https://repo1.maven.org/maven2/org/contextmapper/context-mapper-cli/${CONTEXT_MAPPER_VERSION}/context-mapper-cli-${CONTEXT_MAPPER_VERSION}.tar" \
	| tar -x -C /opt \
	&& ln -s "/opt/context-mapper-cli-${CONTEXT_MAPPER_VERSION}/bin/cm" /usr/local/bin/cm

WORKDIR /work
ENTRYPOINT ["cm"]
