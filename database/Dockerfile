FROM ankane/pgvector

# We extend the pgvector image to also include pgTAP so we can write and run tests directly in SQL.
# pgTAP is not to be installed in production databases, don't use it in migrations or anything, it's
# just going to be run like a script on top of our Docker container.
RUN apt-get update && apt-get install curl zip make patch -y
WORKDIR /install
RUN curl https://api.pgxn.org/dist/pgtap/1.3.3/pgtap-1.3.3.zip -o pgtap-1.3.3.zip
RUN unzip pgtap-1.3.3.zip
WORKDIR /install/pgtap-1.3.3
RUN make && make install
RUN cpan TAP::Parser::SourceHandler::pgTAP
WORKDIR /
