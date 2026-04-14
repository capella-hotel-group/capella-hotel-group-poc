const htmlTemplate = ``;

export default async function decorate(block: HTMLElement): Promise<void> {
  block.replaceChildren(htmlTemplate);
}
