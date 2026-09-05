# Chrome83 실검증용 이미지. Debian snapshot.debian.org에 고정된
# chromium=83.0.4103.116-3(2020-07-12 sid snapshot)을 설치하고, Playwright
# executablePath launch를 컨테이너 안에서 실행한다.
#
# 공식 호환성 목표(tsup.config.ts의 target: "chrome75",
# docs/adr/0001-chrome75-target-vs-chrome83-automation-floor.md)는 Chrome75다.
# 이 이미지가 실제로 설치하는 건 83인데, Playwright가 page/context 생성 시
# 무조건 호출하는 CDP `Browser.setDownloadBehavior`가 Chrome75/76엔 없고
# Chrome82 branch point부터 존재하기 때문이다 — Chrome82 미만은 Playwright/CDP가
# 구조적으로 자동화하지 못한다. Debian 스냅샷 아카이브엔 82.x가 없어 83.x가
# 실제 검증 가능한 최소 버전이다. sibling 프로젝트 scrolla와 inspecta가 먼저
# 검증한 정확히 같은 조합(Debian buster-slim + 이 스냅샷 리비전 + 이 Chromium
# 버전)을 그대로 재사용한다.
FROM debian:buster-slim

ARG NODE_VERSION=24.15.0
ARG PNPM_VERSION=11.25.0

RUN set -eux; \
    # 20200712T145349Z(83.0.4103.116-3)를 쓴다 — 같은 버전의 더 이른 리비전
    # (-1, 20200623T204338Z)은 그 스냅샷 시점 아카이브가 전이 중이었는지
    # libavformat58 의존성이 깨져 apt install이 실패한다(scrolla/inspecta 실측).
    echo "deb [check-valid-until=no trusted=yes] http://snapshot.debian.org/archive/debian/20200712T145349Z unstable main" > /etc/apt/sources.list; \
    printf 'Acquire::Check-Valid-Until "false";\nAcquire::Retries "5";\n' > /etc/apt/apt.conf.d/99snapshot; \
    apt-get update; \
    # dbus-x11을 먼저 설치해 apt 리졸버가 default-dbus-session-bus 가상
    # 패키지의 provider를 systemd 체인(이 스냅샷엔 없음)이 아니라 dbus-x11로
    # 먼저 고정하게 한다 — 순서를 바꾸면 libgtk-3-0이 막혀 chromium 설치가
    # 막힌다.
    apt-get install -y --no-install-recommends dbus-x11; \
    apt-get install -y --no-install-recommends chromium=83.0.4103.116-3; \
    apt-get install -y --no-install-recommends curl ca-certificates xz-utils; \
    curl -fsSL -o /tmp/node.tar.xz "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"; \
    mkdir -p /usr/local/lib/nodejs; \
    tar -xJf /tmp/node.tar.xz -C /usr/local/lib/nodejs; \
    rm /tmp/node.tar.xz; \
    export PATH="/usr/local/lib/nodejs/node-v${NODE_VERSION}-linux-x64/bin:${PATH}"; \
    # corepack activate는 pnpm 서명 키가 이 Node 버전 번들 corepack의 키
    # 목록에 없으면 실패할 수 있어(키 로테이션 문제, scrolla/inspecta 실측)
    # npm 전역 설치로 이 위험을 피한다.
    npm install -g "pnpm@${PNPM_VERSION}"; \
    rm -rf /var/lib/apt/lists/*

ENV PATH="/usr/local/lib/nodejs/node-v${NODE_VERSION}-linux-x64/bin:${PATH}"
WORKDIR /repo
