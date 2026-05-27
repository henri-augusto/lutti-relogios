"use client";

export async function animateFlyToCart({ sourceElement, targetElement, imageUrl }) {
  if (!sourceElement || !targetElement || typeof window === "undefined") {
    return;
  }

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
    return;
  }

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.position = "fixed";
  ghost.style.left = `${sourceRect.left + sourceRect.width / 2 - 24}px`;
  ghost.style.top = `${sourceRect.top + sourceRect.height / 2 - 24}px`;
  ghost.style.width = "48px";
  ghost.style.height = "48px";
  ghost.style.borderRadius = "999px";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "90";
  ghost.style.willChange = "transform, opacity";
  ghost.style.transition = "transform 650ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 650ms ease";
  ghost.style.backgroundColor = "#111111";
  ghost.style.boxShadow = "0 12px 24px rgba(0,0,0,.22)";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "999px";
    ghost.appendChild(img);
  }

  document.body.appendChild(ghost);

  await new Promise((resolve) => requestAnimationFrame(resolve));

  const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  ghost.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.28)`;
  ghost.style.opacity = "0.3";

  await new Promise((resolve) => setTimeout(resolve, 680));
  ghost.remove();
}
