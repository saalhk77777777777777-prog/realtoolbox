/** TOOLBOX v0.14.56 — Persistent Tabi Reward + Chzzk Confirm Link
 * Local-only secrets. No analytics, network calls, or user-input collection.
 */
const STORAGE_KEY = "toolbox:tabi-easter-eggs:v1";
const SKY_BLUE = "#7fd0ff";
const TABI_REWARD_PHOTO = `${import.meta.env.BASE_URL}images/tabi/cute-tabi.png`;
const TABI_FALLBACK_ART = `${import.meta.env.BASE_URL}tabi-easter-egg.svg`;
const NO_MEANING_STEPS: ReadonlyArray<{ clicks: number; message: string }> = [
  { clicks: 10, message: "아무 의미 없다니깐요" },
  { clicks: 30, message: "계속할 거예요?" },
  { clicks: 50, message: "그만해요" },
  { clicks: 51, message: "그만하라고" },
  { clicks: 61, message: "진짜 궁금해요?" },
  { clicks: 64, message: "진짜?" },
  { clicks: 66, message: "개귀여운 타비 사진 발견!!" },
];

export type NoMeaningState = { clicks: number; message: string; unlocked: boolean; finished: boolean };

export function getNoMeaningState(clicks: number): NoMeaningState {
  const safeClicks = Math.max(0, Math.floor(Number.isFinite(clicks) ? clicks : 0));
  const step = [...NO_MEANING_STEPS].reverse().find((item) => safeClicks >= item.clicks);
  return {
    clicks: Math.min(safeClicks, 66),
    message: safeClicks >= 66 ? "(더 이상 눌러봤자 의미가 없음)" : step?.message ?? "아무 의미 없는 버튼",
    unlocked: safeClicks >= 66,
    finished: safeClicks >= 66,
  };
}

type EggProgress = { noMeaningClicks: number; found: string[] };
function loadProgress(): EggProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { noMeaningClicks: 0, found: [] };
    const value = JSON.parse(raw) as Partial<EggProgress>;
    return {
      noMeaningClicks: Math.max(0, Math.min(66, Math.floor(Number(value.noMeaningClicks) || 0))),
      found: Array.isArray(value.found) ? value.found.filter((v): v is string => typeof v === "string").slice(0, 30) : [],
    };
  } catch { return { noMeaningClicks: 0, found: [] }; }
}
function saveProgress(progress: EggProgress): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* private mode */ }
}

let progress = loadProgress();
let modal: HTMLDivElement | null = null;
let logoClicks = 0;
let footerClicks = 0;
let typed = "";
let konamiIndex = 0;
let lastTap = 0;
let toastTimer = 0;
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function ensureModal(): HTMLDivElement {
  if (modal?.isConnected) return modal;
  modal = document.createElement("div");
  modal.className = "tabi-egg-overlay";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "tabi-egg-title");
  modal.innerHTML = '<section class="tabi-egg-dialog"><button class="tabi-egg-close" type="button" aria-label="닫기">×</button><div class="tabi-egg-eyebrow">TABI\'S SECRET EXPEDITION</div><div class="tabi-egg-art"><img data-tabi-reward-image src="" alt="하늘색 양갈래 머리와 고글, 탐험가 장비를 착용한 귀여운 타비 스타일의 치비 일러스트"></div><h2 id="tabi-egg-title">타비의 비밀 탐험일지</h2><p class="tabi-egg-message"></p><div class="tabi-egg-count"></div><button class="tabi-egg-primary" type="button">계속 탐험하기</button><a class="tabi-egg-primary tabi-egg-confirm-link" href="https://chzzk.naver.com/a6c4ddb09cdb160478996007bff35296" hidden>확인</a><p class="tabi-egg-real-confirm" hidden><u>진짜 확인버튼</u></p></section>';
  const rewardImage = modal.querySelector<HTMLImageElement>("[data-tabi-reward-image]")!;
  rewardImage.src = TABI_REWARD_PHOTO;
  rewardImage.addEventListener("error", () => {
    if (rewardImage.getAttribute("src") !== TABI_FALLBACK_ART) rewardImage.src = TABI_FALLBACK_ART;
  });
  document.body.append(modal);
  modal.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const finalReward = modal?.querySelector<HTMLElement>(".tabi-egg-dialog")?.classList.contains("is-final-reward") ?? false;
    if (target === modal) {
      if (!finalReward) closeModal();
      return;
    }
    if (target.closest(".tabi-egg-close")) {
      if (!finalReward) closeModal();
      return;
    }
    if (target.closest(".tabi-egg-primary") && !finalReward) closeModal();
  });
  return modal;
}
function showEgg(title: string, message: string, eggId: string, final = false): void {
  if (!progress.found.includes(eggId)) { progress.found.push(eggId); saveProgress(progress); }
  const node = ensureModal();
  node.querySelector<HTMLElement>("#tabi-egg-title")!.textContent = title;
  node.querySelector<HTMLElement>(".tabi-egg-message")!.textContent = message;
  node.querySelector<HTMLElement>(".tabi-egg-count")!.textContent = "발견한 비밀: " + progress.found.length + "개";
  const dialog = node.querySelector<HTMLElement>(".tabi-egg-dialog")!;
  dialog.classList.toggle("is-final-reward", final);
  node.querySelector<HTMLElement>(".tabi-egg-eyebrow")!.hidden = final;
  node.querySelector<HTMLElement>("#tabi-egg-title")!.hidden = final;
  node.querySelector<HTMLElement>(".tabi-egg-message")!.hidden = final;
  node.querySelector<HTMLElement>(".tabi-egg-count")!.hidden = final;
  node.querySelector<HTMLButtonElement>(".tabi-egg-close")!.hidden = final;
  node.querySelector<HTMLButtonElement>(".tabi-egg-primary:not(.tabi-egg-confirm-link)")!.hidden = final;
  node.querySelector<HTMLAnchorElement>(".tabi-egg-confirm-link")!.hidden = !final;
  node.querySelector<HTMLElement>(".tabi-egg-real-confirm")!.hidden = !final;
  node.querySelector<HTMLElement>(".tabi-egg-art")!.classList.toggle("is-final", final);
  const rewardImage = node.querySelector<HTMLImageElement>("[data-tabi-reward-image]");
  if (rewardImage) {
    rewardImage.alt = final ? "66번 클릭해서 해금한 타비 보상 사진" : "하늘색 양갈래 머리와 고글, 탐험가 장비를 착용한 귀여운 타비 스타일의 치비 일러스트";
    rewardImage.src = final ? TABI_REWARD_PHOTO : TABI_FALLBACK_ART;
  }
  node.hidden = false;
  document.body.classList.add("tabi-egg-open");
  node.querySelector<HTMLElement>(final ? ".tabi-egg-confirm-link" : ".tabi-egg-close")?.focus();
}
function closeModal(): void {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("tabi-egg-open");
}
function showToast(message: string): void {
  let toast = document.getElementById("tabi-egg-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "tabi-egg-toast";
    toast.className = "tabi-egg-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast?.classList.remove("is-visible"), 2600);
}
function applySkyBlueMode(): void {
  document.documentElement.style.setProperty("--accent", SKY_BLUE);
  document.documentElement.style.setProperty("--accent-weak", "#e4f7ff");
  document.body.classList.add("tabi-sky-mode");
}

export function installTabiEasterEggs(): void {
  if (document.documentElement.dataset.tabiEggsInstalled === "true") return;
  document.documentElement.dataset.tabiEggsInstalled = "true";
  ensureModal();

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-tabi-no-meaning]");
    if (button) {
      event.preventDefault();
      if (progress.noMeaningClicks >= 66) {
        button.textContent = "(더 이상 눌러봤자 의미가 없음)";
        button.disabled = true;
        return;
      }
      progress.noMeaningClicks = Math.min(66, progress.noMeaningClicks + 1);
      saveProgress(progress);
      const state = getNoMeaningState(progress.noMeaningClicks);
      button.textContent = state.finished ? "개귀여운 타비 사진 발견!!" : "아무 의미 없는 버튼 · " + state.clicks + "/66";
      button.setAttribute("aria-label", "아무 의미 없는 버튼, " + state.clicks + "번 클릭");
      const step = NO_MEANING_STEPS.find((item) => item.clicks === state.clicks);
      if (state.finished) {
        button.disabled = true;
        showEgg("개귀여운 타비 사진", "66번이나 눌렀으니까 특별히 보여주는 거예요! …근데 진짜 왜 눌렀어요?", "no-meaning-66", true);
      } else if (step) showToast(step.message);
      return;
    }
    if (target.closest("[data-tabi-brand]")) {
      const now = Date.now();
      logoClicks = now - lastTap < 1500 ? logoClicks + 1 : 1;
      lastTap = now;
      if (logoClicks >= 3) {
        logoClicks = 0;
        applySkyBlueMode();
        showEgg("탐험 모드 해금!", "고글 챙겼어요? 이제부터 TOOLBOX는 타비의 탐험 구역이에요. 🧭", "brand-triple");
      }
      return;
    }
    if (target.closest("[data-tabi-footer-secret]")) {
      footerClicks += 1;
      if (footerClicks >= 3) {
        footerClicks = 0;
        showEgg("탐험일지 #03", "단서: 타비가 좋아하는 숫자는 3. 나머지 비밀도 천천히 찾아봐요!", "footer-triple");
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { if (!modal?.querySelector(".tabi-egg-dialog")?.classList.contains("is-final-reward")) closeModal(); return; }
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    konamiIndex = key === KONAMI[konamiIndex] ? konamiIndex + 1 : key === KONAMI[0] ? 1 : 0;
    if (konamiIndex === KONAMI.length) {
      konamiIndex = 0;
      showEgg("비밀 코드 성공!", "개발자도 모르게 숨겨둔 탐험가 코드예요. 역시 눈썰미가 좋네요!", "konami");
    }
    if (key.length === 1 && /[a-z]/i.test(key)) {
      typed = (typed + key).slice(-4);
      if (typed === "tabi") {
        typed = "";
        showEgg("타비 발견!", "이름을 입력했더니 진짜 나타났어요. 우연… 맞겠죠?", "typed-tabi");
      }
    }
  });

  document.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    if (!(input instanceof HTMLInputElement) || !input.matches("#gs, [data-hero-search]")) return;
    const query = input.value.trim().toLowerCase();
    if (query === "#7fd0ff" || query === "7fd0ff") {
      applySkyBlueMode();
      showToast("하늘색 신호 확인! 타비의 색을 알아냈어요 💙");
    } else if (query === "101번째 도구" || query === "101st tool") {
      showEgg("숨겨진 101번째 도구", "이 도구는 목록에 없어요. 진짜 도구는… 바로 이 비밀을 찾아낸 당신!", "tool-101");
    } else if (query === "타비" || query === "tabi") {
      showToast("검색 결과 말고도… 타비가 어딘가에 숨어 있을지도? 🧭");
    }
  });

  {
    const button = document.querySelector<HTMLButtonElement>("[data-tabi-no-meaning]");
    if (button && progress.noMeaningClicks >= 66) { button.textContent = "(더 이상 눌러봤자 의미가 없음)"; button.disabled = true; }
    else if (button && progress.noMeaningClicks > 0) button.textContent = "아무 의미 없는 버튼 · " + progress.noMeaningClicks + "/66";
  }
}
export const TABI_EASTER_EGG_IDS = ["no-meaning-66", "brand-triple", "footer-triple", "konami", "typed-tabi", "tool-101"] as const;
