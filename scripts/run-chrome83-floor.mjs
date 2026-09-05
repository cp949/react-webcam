import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    // 컨테이너 안은 TTY가 없어, pnpm 11의 자동 의존성 상태 검사가 node_modules
    // 재생성 확인을 받지 못해 ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY로
    // 중단된다(실측). CI=true로 확인 프롬프트를 건너뛴다 — 이 저장소의 다른
    // pnpm 11 마이그레이션 문서에서도 같은 패턴을 사용한다.
    //
    // podman --userns=keep-id 컨테이너는 /etc/passwd에 호스트 uid를 매핑하며
    // HOME을 컨테이너 WORKDIR(/repo, 즉 bind mount된 저장소 루트)로 설정한다.
    // pnpm의 기본 store/cache 경로는 $HOME 기준이라, 손대지 않으면 pnpm이
    // 저장소 작업 트리 안에 .local/.cache를 실제로 써서 host git 워킹 트리를
    // 오염시키고 host의 pnpm storeDir 포인터까지 깨뜨린다(실측). 컨테이너 전용
    // 임시 HOME(/tmp, 컨테이너가 --rm이라 실행 후 사라짐)으로 고정해
    // .local/.cache 오염은 막는다. 다만 pnpm 11은 fresh HOME + workspace root
    // cwd 조건에서 store-dir 기본값을 <워크스페이스 루트>/.pnpm-store로
    // 잡으므로 이것까지 완전히 막지는 못한다(실측) — 남는 .pnpm-store는
    // .gitignore로 무해화하고 clean.sh로 정리한다.
    env: { ...process.env, CHROME83_WEBSERVER: "1", CI: "true", HOME: "/tmp" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")}가 exit=${String(result.status)}로 실패했습니다.`);
  }
}

function assertChrome83Binary() {
  const result = spawnSync("/usr/bin/chromium", ["--version"], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(
      "/usr/bin/chromium --version 실행에 실패했습니다. docker/chrome83 컨테이너 안에서 " +
        "실행 중인지 확인하세요:\n" +
        "  podman build -t react-webcam-chrome83 docker/chrome83\n" +
        '  podman run --rm --network host --userns=keep-id -v "$(pwd)":/repo react-webcam-chrome83 node scripts/run-chrome83-floor.mjs',
    );
  }
  if (!result.stdout.includes("83.0.4103.116")) {
    throw new Error(
      `이 게이트는 Chrome 83.0.4103.116 고정 바이너리를 전제한다. 실제 버전: "${result.stdout.trim()}" — ` +
        "docker/chrome83 컨테이너 밖에서 실행되고 있을 가능성이 높다. 이 상태로 통과해도 " +
        "\"Chrome 83 통과\"로 기록할 수 없다.",
    );
  }
}

assertChrome83Binary();

// 다운레벨된 dist를 검증 대상으로 삼으므로 매번 새로 빌드한다.
run("pnpm", ["--filter", "@cp949/react-webcam", "build"]);
run("pnpm", ["exec", "playwright", "test", "--project=chrome83-floor"]);
