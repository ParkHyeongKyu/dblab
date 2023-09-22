FROM mysql:5.7-debian
RUN apt-get update && apt-get install -y locales
RUN localedef -f UTF-8 -i ko_KR ko_KR.UTF-8
ENV LC_ALL ko_KR.UTF-8
