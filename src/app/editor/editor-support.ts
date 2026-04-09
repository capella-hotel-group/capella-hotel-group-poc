import DOMPurify from 'dompurify';
import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadSections,
} from '@/app/aem';
import { decorateMain } from '@/app/scripts';
import decorateRichtext from './editor-support-rte';

let promiseChanges$: Promise<boolean> = Promise.resolve(false);

async function applyChanges(event: Event): Promise<boolean> {
  await promiseChanges$;

  const { detail } = event as CustomEvent;

  const resource: string | undefined =
    detail?.request?.target?.resource ||
    detail?.request?.target?.container?.resource ||
    detail?.request?.to?.container?.resource;
  if (!resource) return false;

  const updates: Array<{ content?: string }> = detail?.response?.updates ?? [];
  if (!updates.length) return false;

  const { content } = updates[0];
  if (!content) return false;

  const sanitizedContent = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  });
  const parsedUpdate = new DOMParser().parseFromString(sanitizedContent, 'text/html');
  const element = document.querySelector<HTMLElement>(`[data-aue-resource="${resource}"]`);
  if (!element) return false;

  if (element.matches('main')) {
    const newMain = parsedUpdate.querySelector<HTMLElement>(`[data-aue-resource="${resource}"]`);
    if (!newMain) return false;
    newMain.style.display = 'none';
    element.insertAdjacentElement('afterend', newMain);
    decorateMain(newMain);
    decorateRichtext(newMain);
    await loadSections(newMain);
    element.remove();
    newMain.style.display = '';

    attachEventListeners(newMain);
    return true;
  }

  const block =
    element.parentElement?.closest<HTMLElement>('.block[data-aue-resource]') ??
    element.closest<HTMLElement>('.block[data-aue-resource]');

  if (block) {
    const blockResource = block.getAttribute('data-aue-resource');
    const newBlock = parsedUpdate.querySelector<HTMLElement>(`[data-aue-resource="${blockResource}"]`);
    if (newBlock) {
      newBlock.style.display = 'none';
      block.insertAdjacentElement('afterend', newBlock);
      decorateButtons(newBlock);
      decorateIcons(newBlock);
      decorateBlock(newBlock);
      decorateRichtext(newBlock);
      await loadBlock(newBlock);
      block.remove();
      newBlock.style.display = '';
      return true;
    }
  } else {
    const newElements = parsedUpdate.querySelectorAll<HTMLElement>(
      `[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`,
    );
    if (newElements.length) {
      const { parentElement } = element;
      if (element.matches('.section') && parentElement) {
        const [newSection] = newElements;
        newSection.style.display = 'none';
        element.insertAdjacentElement('afterend', newSection);
        decorateButtons(newSection);
        decorateIcons(newSection);
        decorateRichtext(newSection);
        decorateSections(parentElement);
        decorateBlocks(parentElement);
        await loadSections(parentElement);
        element.remove();
        newSection.style.display = '';
      } else if (parentElement) {
        element.replaceWith(...newElements);
        decorateButtons(parentElement);
        decorateIcons(parentElement);
        decorateRichtext(parentElement);
      }
      return true;
    }
  }

  return false;
}

function attachEventListeners(main: HTMLElement): void {
  const events = [
    'aue:content-patch',
    'aue:content-update',
    'aue:content-add',
    'aue:content-move',
    'aue:content-remove',
    'aue:content-copy',
  ] as const;

  events.forEach((eventType) => {
    main?.addEventListener(eventType, async (event) => {
      event.stopPropagation();
      promiseChanges$ = applyChanges(event);
      const applied = await promiseChanges$;
      if (!applied) window.location.reload();
    });
  });
}

const mainEl = document.querySelector<HTMLElement>('main');
if (mainEl) attachEventListeners(mainEl);

// Decorate rich text after decorateMain() and on every subsequent decorateBlocks() call
decorateRichtext();
const observer = new MutationObserver(() => decorateRichtext());
observer.observe(document, {
  attributeFilter: ['data-richtext-prop'],
  subtree: true,
});
